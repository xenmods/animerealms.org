mod discord;
mod proxy;
mod downloader;
mod providers;

use discord::{init_discord, SharedDiscordManager};

use std::net::TcpStream;
use std::process::Command;
use std::time::Duration;
use tauri::{Manager, State};

struct AppState {
    discord: SharedDiscordManager,
}

#[tauri::command]
fn get_proxy_url() -> String {
    "http://127.0.0.1:39282".to_string()
}

#[tauri::command]
fn is_desktop() -> bool {
    true
}

#[tauri::command]
fn set_discord_presence(
    state: State<'_, AppState>,
    details: String,
    state_text: Option<String>,
    large_image: Option<String>,
    large_text: Option<String>,
    small_image: Option<String>,
    small_text: Option<String>,
    time_elapsed: Option<u64>,
    duration: Option<u64>,
    button1_label: Option<String>,
    button1_url: Option<String>,
    button2_label: Option<String>,
    button2_url: Option<String>,
) -> Result<(), String> {
    if let Ok(mut discord) = state.discord.lock() {
        let _ = discord.update_presence(
            &details,
            state_text.as_deref(),
            large_image.as_deref(),
            large_text.as_deref(),
            small_image.as_deref(),
            small_text.as_deref(),
            time_elapsed,
            duration,
            button1_label.as_deref(),
            button1_url.as_deref(),
            button2_label.as_deref(),
            button2_url.as_deref(),
        );
    }
    Ok(())
}


#[tauri::command]
fn clear_discord_presence(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut discord) = state.discord.lock() {
        let _ = discord.clear_activity();
    }
    Ok(())
}

#[tauri::command]
fn open_in_browser(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_episode_download(
    app: tauri::AppHandle,
    stream_url: String,
    anime_title: String,
    episode_number: i32,
    quality: Option<String>,
    referer: Option<String>,
) -> Result<String, String> {
    downloader::download_hls(app, stream_url, anime_title, episode_number, quality, referer).await
}

#[tauri::command]
fn open_downloads_folder() -> Result<(), String> {
    downloader::open_downloads()
}

#[tauri::command]
fn get_downloaded_files() -> Result<Vec<downloader::DownloadedFile>, String> {
    downloader::list_downloaded_files()
}

#[tauri::command]
fn delete_downloaded_file(file_path: String) -> Result<(), String> {
    downloader::delete_file(&file_path)
}

#[tauri::command]
fn play_downloaded_file(file_path: String) -> Result<(), String> {
    downloader::play_file(&file_path)
}

#[tauri::command]
fn get_custom_provider_files() -> Result<Vec<providers::CustomProviderFileInfo>, String> {
    providers::list_provider_files()
}

#[tauri::command]
fn save_custom_provider_file(filename: String, code: String) -> Result<(), String> {
    providers::save_provider_file(filename, code)
}

#[tauri::command]
fn delete_custom_provider_file(filename: String) -> Result<(), String> {
    providers::delete_provider_file(filename)
}

#[tauri::command]
fn open_providers_folder() -> Result<(), String> {
    providers::open_providers_folder()
}





fn find_server_js() -> Option<(std::path::PathBuf, std::path::PathBuf)> {
    let mut search_dirs = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        search_dirs.push(cwd);
    }
    if let Ok(exe) = std::env::current_exe() {
        let mut curr = exe.parent();
        while let Some(dir) = curr {
            search_dirs.push(dir.to_path_buf());
            curr = dir.parent();
        }
    }

    for base in search_dirs {
        let candidate = base.join(".next").join("standalone").join("server.js");
        if candidate.exists() {
            return Some((candidate, base));
        }
        let candidate_root = base.join("server.js");
        if candidate_root.exists() {
            return Some((candidate_root, base));
        }
    }
    None
}


fn find_runtime_binary() -> Vec<std::path::PathBuf> {
    let mut candidates = Vec::new();
    let pf_node = std::path::PathBuf::from(r"C:\Program Files\nodejs\node.exe");
    if pf_node.exists() {
        candidates.push(pf_node);
    }
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        let bun_path = std::path::PathBuf::from(userprofile).join(r".bun\bin\bun.exe");
        if bun_path.exists() {
            candidates.push(bun_path);
        }
    }
    candidates.push(std::path::PathBuf::from("node"));
    candidates.push(std::path::PathBuf::from("bun"));
    candidates
}

fn ensure_backend_server() {
    let target = "127.0.0.1:3000";
    if TcpStream::connect_timeout(&target.parse().unwrap(), Duration::from_millis(300)).is_err() {
        if let Some((server_script, working_dir)) = find_server_js() {
            log::info!(
                "[Anime Realms] Launching silent standalone backend: {:?} in {:?}",
                server_script,
                working_dir
            );
            for runtime in find_runtime_binary() {
                let mut cmd = Command::new(&runtime);
                cmd.arg(&server_script)
                    .current_dir(&working_dir)
                    .env("PORT", "3000")
                    .env("HOSTNAME", "127.0.0.1")
                    .env("AUTH_TRUST_HOST", "true")
                    .env("NEXTAUTH_URL", "http://localhost:3000");


                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    const CREATE_NO_WINDOW: u32 = 0x08000000;
                    cmd.creation_flags(CREATE_NO_WINDOW);
                }

                if let Ok(_) = cmd.spawn() {
                    log::info!("[Anime Realms] Successfully spawned backend server with {:?}", runtime);
                    break;
                }
            }
        } else {
            log::warn!("[Anime Realms] Standalone server.js not found in any ancestor directories");
        }
    }
}




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let discord = init_discord();
    let app_state = AppState { discord };

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_proxy_url,
            is_desktop,
            set_discord_presence,
            clear_discord_presence,
            open_in_browser,
            start_episode_download,
            open_downloads_folder,
            get_downloaded_files,
            delete_downloaded_file,
            play_downloaded_file,
            get_custom_provider_files,
            save_custom_provider_file,
            delete_custom_provider_file,
            open_providers_folder
        ])




        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Start local streaming proxy on port 39282
            tauri::async_runtime::spawn(async move {
                proxy::start_proxy_server(39282).await;
            });

            // Ensure Next.js standalone backend is spawned
            ensure_backend_server();

            // Wait for 127.0.0.1:3000 to be ready and automatically navigate and focus
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let target: std::net::SocketAddr = "127.0.0.1:3000".parse().unwrap();
                for i in 0..60 {
                    tokio::time::sleep(Duration::from_millis(250)).await;
                    if std::net::TcpStream::connect_timeout(&target, Duration::from_millis(200)).is_ok() {
                        log::info!("[Anime Realms] Backend server is READY! Navigating webview...");
                        if let Some(window) = handle.get_webview_window("main") {
                            let _ = window.navigate(tauri::Url::parse("http://localhost:3000/en").unwrap());
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        break;

                    }
                    if i % 10 == 0 {
                        log::info!("[Anime Realms] Waiting for backend server on 127.0.0.1:3000...");
                    }
                }
            });

            log::info!("[Anime Realms] Desktop engine & local proxy initialized successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



