use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

// Discord App ID for Anime Realms
const DEFAULT_DISCORD_APP_ID: &str = "1543175040563023922";


pub struct DiscordManager {
    client: Option<DiscordIpcClient>,
    is_connected: bool,
}

impl DiscordManager {
    pub fn new() -> Self {
        Self {
            client: None,
            is_connected: false,
        }
    }

    fn get_app_id() -> String {
        std::env::var("DISCORD_CLIENT_ID")
            .unwrap_or_else(|_| DEFAULT_DISCORD_APP_ID.to_string())
    }

    pub fn connect(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_connected && self.client.is_some() {
            return Ok(());
        }

        let app_id = Self::get_app_id();
        let mut client = DiscordIpcClient::new(&app_id)?;
        if client.connect().is_ok() {
            self.client = Some(client);
            self.is_connected = true;
            log::info!("[Discord RPC] Connected successfully to Discord IPC with ID: {}", app_id);
        } else {
            self.client = None;
            self.is_connected = false;
        }
        Ok(())
    }


    pub fn update_presence(
        &mut self,
        details: &str,
        state: Option<&str>,
        large_image: Option<&str>,
        large_text: Option<&str>,
        small_image: Option<&str>,
        small_text: Option<&str>,
        time_elapsed_secs: Option<u64>,
        duration_secs: Option<u64>,
        button1_label: Option<&str>,
        button1_url: Option<&str>,
        button2_label: Option<&str>,
        button2_url: Option<&str>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if !self.is_connected || self.client.is_none() {
            let _ = self.connect();
        }

        if let Some(client) = &mut self.client {
            let mut payload = activity::Activity::new().details(details);

            if let Some(st) = state {
                if !st.is_empty() {
                    payload = payload.state(st);
                }
            }

            let mut assets = activity::Assets::new();
            let mut has_assets = false;

            if let Some(img) = large_image {
                if !img.is_empty() {
                    assets = assets.large_image(img);
                    has_assets = true;
                }
            } else {
                assets = assets.large_image("https://raw.githubusercontent.com/xenmods/animerealms.org/main/public/traced-logo.png");
                has_assets = true;
            }

            if let Some(txt) = large_text {
                if !txt.is_empty() {
                    assets = assets.large_text(txt);
                    has_assets = true;
                }
            } else {
                assets = assets.large_text("AnimeRealms");
                has_assets = true;
            }

            if let Some(s_img) = small_image {
                if !s_img.is_empty() {
                    assets = assets.small_image(s_img);
                    has_assets = true;
                }
            }

            if let Some(s_txt) = small_text {
                if !s_txt.is_empty() {
                    assets = assets.small_text(s_txt);
                    has_assets = true;
                }
            }

            if has_assets {
                payload = payload.assets(assets);
            }

            if let Some(elapsed) = time_elapsed_secs {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64;
                let start_time = now - (elapsed as i64);
                let mut timestamps = activity::Timestamps::new().start(start_time);
                if let Some(dur) = duration_secs {
                    if dur > 0 {
                        timestamps = timestamps.end(start_time + (dur as i64));
                    }
                }
                payload = payload.timestamps(timestamps);
            }

            let mut buttons = Vec::new();
            if let (Some(l1), Some(u1)) = (button1_label, button1_url) {
                if !l1.is_empty() && !u1.is_empty() {
                    buttons.push(activity::Button::new(l1, u1));
                }
            }
            if let (Some(l2), Some(u2)) = (button2_label, button2_url) {
                if !l2.is_empty() && !u2.is_empty() {
                    buttons.push(activity::Button::new(l2, u2));
                }
            }

            if !buttons.is_empty() {
                payload = payload.buttons(buttons);
            }

            if let Err(e) = client.set_activity(payload) {
                log::warn!("[Discord RPC] Failed to set activity: {}", e);
                self.is_connected = false;
                self.client = None;
            } else {
                log::info!("[Discord RPC] Activity updated successfully");
            }
        }
        Ok(())
    }

    pub fn clear_activity(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(client) = &mut self.client {
            let _ = client.clear_activity();
        }
        Ok(())
    }
}

pub type SharedDiscordManager = Arc<Mutex<DiscordManager>>;

pub fn init_discord() -> SharedDiscordManager {
    let mut manager = DiscordManager::new();
    let _ = manager.connect();
    Arc::new(Mutex::new(manager))
}