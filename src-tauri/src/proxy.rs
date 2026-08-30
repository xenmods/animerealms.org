use axum::{
    body::Body,
    extract::Query,
    http::{header, HeaderMap, HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use futures_util::TryStreamExt;
use reqwest::Client;
use serde::Deserialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use url::Url;

#[derive(Deserialize)]
pub struct FetchParams {
    pub url: String,
    pub ref_: Option<String>,
}

#[derive(Clone)]
pub struct ProxyState {
    pub client: Client,
}

pub async fn start_proxy_server(port: u16) {
    let client = Client::new();
    let state = Arc::new(ProxyState { client });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::HEAD])
        .allow_headers(Any)
        .expose_headers(Any);

    let app = Router::new()
        .route("/", get(handle_splash))
        .route("/splash", get(handle_splash))
        .route("/fetch", get(handle_fetch))
        .route("/local_file", get(handle_local_file))
        .route("/local_playlist.m3u8", get(handle_local_playlist))
        .route("/health", get(health_check))
        .layer(cors)
        .with_state(state);






    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    log::info!("[Rust Proxy] Listening on http://{}", addr);

    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("[Rust Proxy] Failed to bind to {}: {}", addr, e);
            return;
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        log::error!("[Rust Proxy] Server error: {}", e);
    }
}


async fn health_check() -> &'static str {
    "AnimeRealms Rust Proxy OK"
}

async fn handle_splash() -> Response {
    let html = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anime Realms</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background-color: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      animation: fadeIn 0.6s ease-out;
    }
    .logo-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-glow {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
      animation: pulse 2.5s infinite ease-in-out;
    }
    .logo {
      width: 72px;
      height: 72px;
      z-index: 2;
      filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.5));
    }
    .title-group {
      text-align: center;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 13px;
      color: #71717a;
      margin-top: 6px;
      transition: color 0.3s ease;
    }
    .progress-bar-container {
      width: 220px;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #3b82f6, #a855f7, #ec4899);
      border-radius: 999px;
      animation: indeterminate 1.6s infinite ease-in-out;
    }
    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(300%); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.3); opacity: 0.9; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-wrapper">
      <div class="pulse-glow"></div>
      <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <div class="title-group">
      <h1 class="title">Anime Realms</h1>
      <p id="status-text" class="subtitle">Starting local server...</p>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar"></div>
    </div>
  </div>

  <script>
    let tries = 0;
    const statusText = document.getElementById("status-text");

    async function checkServer() {
      tries++;
      try {
        const res = await fetch("http://localhost:3000/en", { method: "HEAD", mode: "no-cors" });
        statusText.innerText = "Launching...";
        statusText.style.color = "#a855f7";
        window.location.replace("http://localhost:3000/en");
        return;
      } catch (err) {
        if (tries > 25) {
          statusText.innerText = "Initializing Next.js engine...";
        }
      }
      setTimeout(checkServer, 250);
    }

    setTimeout(checkServer, 100);
  </script>
</body>
</html>"##;

    let mut res = Response::new(Body::from(html));
    res.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/html; charset=utf-8"),
    );
    res.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("no-cache"),
    );
    res
}



async fn handle_fetch(
    Query(params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
    axum::extract::State(state): axum::extract::State<Arc<ProxyState>>,
) -> Response {
    let target_url = match params.get("url") {
        Some(u) if !u.is_empty() => u,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                "Missing 'url' query parameter",
            )
                .into_response()
        }
    };

    let referer = params.get("ref").or_else(|| params.get("ref_")).cloned();

    let parsed_target = match Url::parse(target_url) {
        Ok(u) => u,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                format!("Invalid target URL: {}", e),
            )
                .into_response()
        }
    };

    let mut req = state.client.get(parsed_target.as_str());

    // Default browser headers
    let user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    req = req.header(header::USER_AGENT, user_agent);

    if let Some(ref_val) = &referer {
        req = req.header(header::REFERER, ref_val);
        if let Ok(ref_url) = Url::parse(ref_val) {
            let origin = format!(
                "{}://{}",
                ref_url.scheme(),
                ref_url.host_str().unwrap_or_default()
            );
            req = req.header(header::ORIGIN, origin);
        }
    } else {
        let origin = format!(
            "{}://{}",
            parsed_target.scheme(),
            parsed_target.host_str().unwrap_or_default()
        );
        req = req.header(header::REFERER, format!("{}/", origin));
        req = req.header(header::ORIGIN, origin);
    }

    // Forward range headers
    if let Some(range) = headers.get(header::RANGE) {
        if let Ok(range_str) = range.to_str() {
            req = req.header(header::RANGE, range_str);
        }
    }

    let upstream_res = match req.send().await {
        Ok(res) => res,
        Err(e) => {
            log::error!("[Rust Proxy] Upstream request error for {}: {}", target_url, e);
            return (
                StatusCode::BAD_GATEWAY,
                format!("Upstream error: {}", e),
            )
                .into_response();
        }
    };

    let status = StatusCode::from_u16(upstream_res.status().as_u16())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    let content_type = upstream_res
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let is_m3u8 = target_url.contains(".m3u8")
        || content_type.contains("mpegurl")
        || content_type.contains("application/x-mpegURL");

    if is_m3u8 {
        let body_bytes = match upstream_res.bytes().await {
            Ok(b) => b,
            Err(e) => {
                return (
                    StatusCode::BAD_GATEWAY,
                    format!("Failed to read m3u8 body: {}", e),
                )
                    .into_response();
            }
        };

        let body_str = String::from_utf8_lossy(&body_bytes);
        let rewritten_m3u8 = rewrite_m3u8(&body_str, &parsed_target, referer.as_deref());

        let mut res = Response::new(Body::from(rewritten_m3u8));
        *res.status_mut() = status;

        let headers_mut = res.headers_mut();
        headers_mut.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/vnd.apple.mpegurl"),
        );
        headers_mut.insert(
            header::ACCESS_CONTROL_ALLOW_ORIGIN,
            HeaderValue::from_static("*"),
        );
        headers_mut.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("no-cache"),
        );

        return res;
    }

    // Binary / video stream forwarding
    let mut res_builder = Response::builder().status(status);

    if let Some(ct) = upstream_res.headers().get(header::CONTENT_TYPE) {
        res_builder = res_builder.header(header::CONTENT_TYPE, ct);
    }
    if let Some(cl) = upstream_res.headers().get(header::CONTENT_LENGTH) {
        res_builder = res_builder.header(header::CONTENT_LENGTH, cl);
    }
    if let Some(cr) = upstream_res.headers().get(header::CONTENT_RANGE) {
        res_builder = res_builder.header(header::CONTENT_RANGE, cr);
    }
    if let Some(ar) = upstream_res.headers().get(header::ACCEPT_RANGES) {
        res_builder = res_builder.header(header::ACCEPT_RANGES, ar);
    }

    res_builder = res_builder.header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*");
    res_builder = res_builder.header(header::ACCESS_CONTROL_ALLOW_HEADERS, "*");

    let body_stream = upstream_res
        .bytes_stream()
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e));

    let body = Body::from_stream(body_stream);

    res_builder.body(body).unwrap_or_else(|_| {
        (StatusCode::INTERNAL_SERVER_ERROR, "Stream response construction failed").into_response()
    })
}

fn rewrite_m3u8(content: &str, base_url: &Url, referer: Option<&str>) -> String {
    let mut rewritten = String::with_capacity(content.len() + 1024);

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() {
            rewritten.push_str("\n");
            continue;
        }

        if trimmed.starts_with('#') {
            if trimmed.starts_with("#EXT-X-KEY:") || trimmed.starts_with("#EXT-X-MAP:") {
                if let Some(start_idx) = trimmed.find("URI=\"") {
                    let prefix = &trimmed[..start_idx + 5];
                    let rest = &trimmed[start_idx + 5..];
                    if let Some(end_idx) = rest.find('"') {
                        let uri = &rest[..end_idx];
                        let suffix = &rest[end_idx..];
                        let abs_url = resolve_url(base_url, uri);
                        let proxied = make_proxy_url(&abs_url, referer);
                        rewritten.push_str(prefix);
                        rewritten.push_str(&proxied);
                        rewritten.push_str(suffix);
                        rewritten.push('\n');
                        continue;
                    }
                }
            }
            rewritten.push_str(line);
            rewritten.push('\n');
        } else {
            let abs_url = resolve_url(base_url, trimmed);
            let proxied = make_proxy_url(&abs_url, referer);
            rewritten.push_str(&proxied);
            rewritten.push('\n');
        }
    }

    rewritten
}

fn resolve_url(base_url: &Url, relative: &str) -> String {
    if relative.starts_with("http://") || relative.starts_with("https://") {
        relative.to_string()
    } else {
        base_url.join(relative).map(|u| u.to_string()).unwrap_or_else(|_| relative.to_string())
    }
}

fn make_proxy_url(target_url: &str, referer: Option<&str>) -> String {
    let encoded_url = urlencoding_encode(target_url);
    if let Some(ref_val) = referer {
        let encoded_ref = urlencoding_encode(ref_val);
        format!(
            "http://127.0.0.1:39282/fetch?url={}&ref={}",
            encoded_url, encoded_ref
        )
    } else {
        format!("http://127.0.0.1:39282/fetch?url={}", encoded_url)
    }
}

fn urlencoding_encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

async fn handle_local_file(
    Query(params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> Response {
    let file_path_str = match params.get("path") {
        Some(p) if !p.is_empty() => p,
        _ => return (StatusCode::BAD_REQUEST, "Missing 'path' query parameter").into_response(),
    };

    let path = std::path::PathBuf::from(file_path_str);
    if !path.exists() || !path.is_file() {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    }

    let file_len = match tokio::fs::metadata(&path).await {
        Ok(m) => m.len(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    let mut header_buf = [0u8; 16];
    let mime_type = if let Ok(mut f) = tokio::fs::File::open(&path).await {
        use tokio::io::AsyncReadExt;
        if let Ok(n) = f.read(&mut header_buf).await {
            if n >= 8 && &header_buf[4..8] == b"ftyp" {
                "video/mp4"
            } else if n >= 1 && header_buf[0] == 0x47 {
                "video/mp2t"
            } else if n >= 4 && &header_buf[0..4] == b"\x1a\x45\xdf\xa3" {
                "video/webm"
            } else {
                match path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase().as_str() {
                    "mp4" => "video/mp4",
                    "ts" => "video/mp2t",
                    "mkv" => "video/x-matroska",
                    "webm" => "video/webm",
                    "jpg" | "jpeg" => "image/jpeg",
                    "png" => "image/png",
                    "webp" => "image/webp",
                    _ => "application/octet-stream",
                }
            }
        } else {
            "video/mp4"
        }
    } else {
        "video/mp4"
    };

    let range_header = headers.get(header::RANGE).and_then(|v| v.to_str().ok());


    if let Some(range_str) = range_header {
        if let Some((start, end)) = parse_range(range_str, file_len) {
            let chunk_len = end - start + 1;

            let mut file = match tokio::fs::File::open(&path).await {
                Ok(f) => f,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
            };

            use tokio::io::AsyncSeekExt;
            if let Err(e) = file.seek(std::io::SeekFrom::Start(start)).await {
                return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
            }

            let take_reader = tokio::io::AsyncReadExt::take(file, chunk_len);
            let stream = tokio_util::io::ReaderStream::new(take_reader);
            let body = Body::from_stream(stream);

            let mut response = (StatusCode::PARTIAL_CONTENT, body).into_response();
            let h = response.headers_mut();
            h.insert(header::CONTENT_TYPE, HeaderValue::from_static(mime_type));
            h.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));
            h.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"));
            h.insert(
                header::ACCESS_CONTROL_EXPOSE_HEADERS,
                HeaderValue::from_static("Content-Range, Accept-Ranges, Content-Length, Content-Type"),
            );
            h.insert(
                header::CONTENT_RANGE,
                HeaderValue::from_str(&format!("bytes {}-{}/{}", start, end, file_len)).unwrap(),
            );
            h.insert(
                header::CONTENT_LENGTH,
                HeaderValue::from_str(&chunk_len.to_string()).unwrap(),
            );
            return response;
        }
    }

    let file = match tokio::fs::File::open(&path).await {
        Ok(f) => f,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };
    let stream = tokio_util::io::ReaderStream::new(file);
    let body = Body::from_stream(stream);

    let mut response = (StatusCode::OK, body).into_response();
    let h = response.headers_mut();
    h.insert(header::CONTENT_TYPE, HeaderValue::from_static(mime_type));
    h.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));
    h.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"));
    h.insert(
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        HeaderValue::from_static("Content-Range, Accept-Ranges, Content-Length, Content-Type"),
    );
    h.insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&file_len.to_string()).unwrap(),
    );
    response
}

async fn handle_local_playlist(
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Response {
    let file_path_str = match params.get("path") {
        Some(p) if !p.is_empty() => p,
        _ => return (StatusCode::BAD_REQUEST, "Missing 'path' parameter").into_response(),
    };

    let path = std::path::PathBuf::from(file_path_str);
    if !path.exists() || !path.is_file() {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    }

    let encoded_path = urlencoding_encode(file_path_str);
    let playlist_content = format!(
        "#EXTM3U\n\
         #EXT-X-VERSION:3\n\
         #EXT-X-PLAYLIST-TYPE:VOD\n\
         #EXT-X-TARGETDURATION:7200\n\
         #EXT-X-MEDIA-SEQUENCE:0\n\
         #EXTINF:7200.0,\n\
         http://127.0.0.1:39282/local_file?path={}\n\
         #EXT-X-ENDLIST\n",
        encoded_path
    );

    let mut response = (StatusCode::OK, playlist_content).into_response();
    let h = response.headers_mut();
    h.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/vnd.apple.mpegurl"),
    );
    h.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"));
    h.insert(
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        HeaderValue::from_static("*"),
    );
    response
}

fn parse_range(range_str: &str, file_len: u64) -> Option<(u64, u64)> {

    if !range_str.starts_with("bytes=") {
        return None;
    }
    let range_val = &range_str[6..];
    let (start_str, end_str) = range_val.split_once('-')?;
    let start: u64 = if start_str.is_empty() {
        let suffix_len: u64 = end_str.parse().ok()?;
        if suffix_len > file_len {
            0
        } else {
            file_len - suffix_len
        }
    } else {
        start_str.parse().ok()?
    };

    let end: u64 = if end_str.is_empty() {
        file_len.saturating_sub(1)
    } else {
        end_str.parse::<u64>().ok()?.min(file_len.saturating_sub(1))
    };


    if start <= end && start < file_len {
        Some((start, end))
    } else {
        None
    }
}

