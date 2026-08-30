use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomProviderFileInfo {
    pub filename: String,
    pub name: String,
    pub code: String,
    pub modified: u64,
}

pub fn get_providers_dir() -> PathBuf {
    let base = if let Ok(appdata) = std::env::var("APPDATA") {
        PathBuf::from(appdata).join("AnimeRealms").join("providers")
    } else if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
        PathBuf::from(home).join(".animerealms").join("providers")
    } else {
        PathBuf::from(".").join("providers")
    };
    let _ = fs::create_dir_all(&base);
    base
}

pub fn list_provider_files() -> Result<Vec<CustomProviderFileInfo>, String> {
    let dir = get_providers_dir();
    let mut results = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "js" || ext_str == "mjs" || ext_str == "ts" {
                        let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let code = fs::read_to_string(&path).unwrap_or_default();
                        let modified = fs::metadata(&path)
                            .ok()
                            .and_then(|m| m.modified().ok())
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs())
                            .unwrap_or(0);

                        let name = filename
                            .trim_end_matches(".js")
                            .trim_end_matches(".mjs")
                            .trim_end_matches(".ts")
                            .to_string();

                        results.push(CustomProviderFileInfo {
                            filename,
                            name,
                            code,
                            modified,
                        });
                    }
                }
            }
        }
    }
    results.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(results)
}

pub fn save_provider_file(filename: String, code: String) -> Result<(), String> {
    let dir = get_providers_dir();
    let clean_name = filename.chars().filter(|c| !r#"\/:*?"<>|"#.contains(*c)).collect::<String>();
    let safe_name = if clean_name.ends_with(".js") || clean_name.ends_with(".mjs") || clean_name.ends_with(".ts") {
        clean_name
    } else {
        format!("{}.js", clean_name)
    };
    let path = dir.join(safe_name);
    fs::write(path, code).map_err(|e| e.to_string())
}

pub fn delete_provider_file(filename: String) -> Result<(), String> {
    let dir = get_providers_dir();
    let path = dir.join(filename);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn open_providers_folder() -> Result<(), String> {
    let dir = get_providers_dir();
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

