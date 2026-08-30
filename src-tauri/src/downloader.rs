use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use url::Url;

pub fn get_downloads_dir() -> PathBuf {
    if let Ok(profile) = std::env::var("USERPROFILE") {
        let dir = PathBuf::from(&profile).join("Downloads").join("Anime Realms");
        let _ = fs::create_dir_all(&dir);

        // Migrate any legacy AnimeRealms files to Anime Realms
        let legacy = PathBuf::from(&profile).join("Downloads").join("AnimeRealms");

        if legacy.exists() && legacy.is_dir() {
            if let Ok(entries) = fs::read_dir(&legacy) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if let Some(name) = p.file_name() {
                        let target = dir.join(name);
                        let _ = fs::rename(&p, &target);
                    }
                }
            }
        }
        return dir;
    }
    PathBuf::from(".")
}

pub fn open_downloads() -> Result<(), String> {
    let dir = get_downloads_dir();
    let _ = fs::create_dir_all(&dir);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = std::process::Command::new("explorer")
            .arg(&dir)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        open::that(dir).map_err(|e| e.to_string())
    }
}


pub fn play_file(file_path: &str) -> Result<(), String> {
    open::that(file_path).map_err(|e| e.to_string())
}

pub fn delete_file(file_path: &str) -> Result<(), String> {
    let path = PathBuf::from(file_path);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn format_file_size(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;

    let b = bytes as f64;
    if b >= GB {
        format!("{:.2} GB", b / GB)
    } else if b >= MB {
        format!("{:.1} MB", b / MB)
    } else if b >= KB {
        format!("{:.0} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn parse_filename(filename: &str) -> (String, i32) {
    let stem = filename.strip_suffix(".mp4").unwrap_or(filename);
    if let Some((title_part, ep_part)) = stem.split_once(" - Episode ") {
        let ep_str: String = ep_part.chars().take_while(|c| c.is_ascii_digit()).collect();
        let ep_num = ep_str.parse::<i32>().unwrap_or(1);
        return (title_part.trim().to_string(), ep_num);
    }
    if let Some(ep_str) = stem.strip_prefix("Episode ") {
        let digits: String = ep_str.chars().take_while(|c| c.is_ascii_digit()).collect();
        let ep_num = digits.parse::<i32>().unwrap_or(1);
        return ("".to_string(), ep_num);
    }
    (stem.to_string(), 1)
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct DownloadedFile {
    pub filename: String,
    pub path: String,
    pub size_bytes: u64,
    pub formatted_size: String,
    pub modified: u64,
    pub anime_title: String,
    pub episode: i32,
}

fn scan_directory(dir: &std::path::Path, results: &mut Vec<DownloadedFile>, parent_title: Option<&str>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    let full_name = path.file_name().unwrap_or_default().to_string_lossy();
                    if (ext_str == "mp4" || ext_str == "mkv" || ext_str == "ts")
                        && !full_name.ends_with(".downloading")
                        && !full_name.ends_with(".part")
                    {
                        if let Ok(metadata) = fs::metadata(&path) {
                            let size_bytes = metadata.len();
                            let formatted_size = format_file_size(size_bytes);
                            let filename = full_name.to_string();
                            let modified = metadata
                                .modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs())
                                .unwrap_or(0);

                            let (parsed_title, episode) = parse_filename(&filename);
                            let anime_title = if !parsed_title.is_empty() {
                                parsed_title
                            } else if let Some(p) = parent_title {
                                p.to_string()
                            } else {
                                "Anime".to_string()
                            };

                            results.push(DownloadedFile {
                                filename,
                                path: path.to_string_lossy().to_string(),
                                size_bytes,
                                formatted_size,
                                modified,
                                anime_title,
                                episode,
                            });
                        }
                    }
                }
            } else if path.is_dir() {
                let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string());
                scan_directory(&path, results, folder_name.as_deref());
            }
        }
    }
}

pub fn list_downloaded_files() -> Result<Vec<DownloadedFile>, String> {
    let downloads_dir = get_downloads_dir();
    let mut results = Vec::new();
    scan_directory(&downloads_dir, &mut results, None);
    results.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(results)
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub anime_title: String,
    pub episode: i32,
    pub current: usize,
    pub total: usize,
    pub percent: u8,
    pub status: String,
}

pub async fn download_hls(
    app: AppHandle,
    stream_url: String,
    anime_title: String,
    episode: i32,
    quality: Option<String>,
    referer: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    // If passed a local proxy URL, extract raw target URL
    let target_url = if stream_url.starts_with("http://127.0.0.1:39282/fetch?url=") {
        if let Ok(parsed) = Url::parse(&stream_url) {
            parsed
                .query_pairs()
                .find(|(k, _)| k == "url")
                .map(|(_, v)| v.to_string())
                .unwrap_or(stream_url.clone())
        } else {
            stream_url.clone()
        }
    } else {
        stream_url.clone()
    };

    let downloads_dir = get_downloads_dir();
    let safe_title: String = anime_title
        .chars()
        .filter(|c| !r#"\/:*?"<>|"#.contains(*c))
        .collect();
    let safe_title = safe_title.trim().to_string();

    let anime_folder = downloads_dir.join(&safe_title);
    let _ = fs::create_dir_all(&anime_folder);

    let quality_suffix = match &quality {
        Some(q) if !q.is_empty() && q != "auto" && q != "default" => format!(" [{}]", q),
        _ => String::new(),
    };

    let file_name = format!(
        "{} - Episode {:02}{}.mp4",
        safe_title,
        episode,
        quality_suffix
    );
    let output_path = anime_folder.join(&file_name);
    let temp_path = anime_folder.join(format!("{}.downloading", file_name));

    let _ = app.emit(
        "download-progress",
        DownloadProgress {
            anime_title: anime_title.clone(),
            episode,
            current: 0,
            total: 100,
            percent: 0,
            status: "Fetching stream...".to_string(),
        },
    );

    if target_url.ends_with(".mp4") || (!target_url.contains(".m3u8") && !target_url.contains("m3u8")) {
        let mut req = client.get(&target_url);
        if let Some(ref r) = referer {
            req = req.header("Referer", r);
        }
        let res = req.send().await.map_err(|e| e.to_string())?;
        let bytes = res.bytes().await.map_err(|e| e.to_string())?;
        fs::write(&temp_path, bytes).map_err(|e| e.to_string())?;
        let _ = fs::rename(&temp_path, &output_path);

        let _ = app.emit(
            "download-progress",
            DownloadProgress {
                anime_title: anime_title.clone(),
                episode,
                current: 100,
                total: 100,
                percent: 100,
                status: "Complete".to_string(),
            },
        );
        return Ok(output_path.to_string_lossy().to_string());
    }

    let mut req = client.get(&target_url);
    if let Some(ref r) = referer {
        req = req.header("Referer", r);
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    let base_url = Url::parse(&target_url).map_err(|e| e.to_string())?;
    let text = res.text().await.map_err(|e| e.to_string())?;

    let mut media_playlist_url = target_url.clone();
    if text.contains("#EXT-X-STREAM-INF") {
        let lines: Vec<&str> = text.lines().collect();
        for i in 0..lines.len() {
            let line = lines[i].trim();
            if line.starts_with("#EXT-X-STREAM-INF") {
                for j in (i + 1)..lines.len() {
                    let next_line = lines[j].trim();
                    if !next_line.is_empty() && !next_line.starts_with('#') {
                        if let Ok(resolved) = base_url.join(next_line) {
                            media_playlist_url = resolved.to_string();
                        }
                        break;
                    }
                }
                break;
            }
        }
    }

    let mut media_req = client.get(&media_playlist_url);
    if let Some(ref r) = referer {
        media_req = media_req.header("Referer", r);
    }
    let media_res = media_req.send().await.map_err(|e| e.to_string())?;
    let media_base = Url::parse(&media_playlist_url).map_err(|e| e.to_string())?;
    let media_text = media_res.text().await.map_err(|e| e.to_string())?;

    let mut segments = Vec::new();
    for line in media_text.lines() {
        let line = line.trim();
        if !line.is_empty() && !line.starts_with('#') {
            if let Ok(seg_url) = media_base.join(line) {
                segments.push(seg_url.to_string());
            }
        }
    }

    if segments.is_empty() {
        return Err("No video segments found in stream playlist".to_string());
    }

    let total = segments.len();
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&temp_path)
        .map_err(|e| e.to_string())?;

    for (idx, seg_url) in segments.into_iter().enumerate() {
        let mut bytes_opt = None;
        for _attempt in 0..3 {
            let mut sreq = client.get(&seg_url);
            if let Some(ref r) = referer {
                sreq = sreq.header("Referer", r);
            }
            if let Ok(sres) = sreq.send().await {
                if sres.status().is_success() {
                    if let Ok(b) = sres.bytes().await {
                        bytes_opt = Some(b);
                        break;
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;
        }

        let bytes = match bytes_opt {
            Some(b) => b,
            None => {
                log::warn!("[Downloader] Segment {} failed after 3 attempts, skipping...", idx + 1);
                continue;
            }
        };

        file.write_all(&bytes).map_err(|e| e.to_string())?;

        let percent = (((idx + 1) as f32 / total as f32) * 100.0) as u8;
        let _ = app.emit(
            "download-progress",
            DownloadProgress {
                anime_title: anime_title.clone(),
                episode,
                current: idx + 1,
                total,
                percent,
                status: format!("Downloading segment {}/{}", idx + 1, total),
            },
        );
    }

    let _ = file.flush();
    drop(file);

    // Losslessly remux MPEG-TS segments into a standard, faststart MP4 file if ffmpeg is available
    let remux_output = anime_folder.join(format!("{}.remux.mp4", file_name));
    let remux_success = std::process::Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            temp_path.to_str().unwrap_or_default(),
            "-map",
            "0:v",
            "-map",
            "0:a",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-bsf:a",
            "aac_adtstoasc",
            "-movflags",
            "+faststart",
            remux_output.to_str().unwrap_or_default(),
        ])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if remux_success && remux_output.exists() {
        let _ = fs::remove_file(&temp_path);
        let _ = fs::rename(&remux_output, &output_path);
    } else {
        if remux_output.exists() {
            let _ = fs::remove_file(&remux_output);
        }
        fs::rename(&temp_path, &output_path).map_err(|e| e.to_string())?;
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgress {
            anime_title: anime_title.clone(),
            episode,
            current: total,
            total,
            percent: 100,
            status: "Complete".to_string(),
        },
    );

    Ok(output_path.to_string_lossy().to_string())
}