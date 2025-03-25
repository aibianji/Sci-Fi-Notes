// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    GlobalShortcutManager,
    WindowBuilder,
    WindowUrl,
    PhysicalSize,
};
use tauri::api::path::app_data_dir;
use tauri::api::dialog::blocking::FileDialogBuilder;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

mod api;

// 自定义命令 - 设置自启动
#[tauri::command]
fn toggle_autostart(app_handle: tauri::AppHandle, enable: bool) -> Result<(), String> {
    let config = app_handle.config();
    let bundle_id = config.tauri.bundle.identifier.as_str();
    
    if bundle_id.is_empty() {
        return Err("应用标识符未配置".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        
        let app_exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_path = app_exe.to_str().ok_or("无法获取应用路径")?;
        
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let run_key = hkcu.open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            KEY_SET_VALUE | KEY_QUERY_VALUE,
        ).map_err(|e| e.to_string())?;
        
        if enable {
            run_key.set_value(bundle_id, &exe_path).map_err(|e| e.to_string())?;
        } else {
            if run_key.get_value::<String, _>(bundle_id).is_ok() {
                run_key.delete_value(bundle_id).map_err(|e| e.to_string())?;
            }
        }
    }
    
    Ok(())
}

// 自定义命令 - 检查自启动状态
#[tauri::command]
fn is_autostart_enabled(app_handle: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        
        let config = app_handle.config();
        let bundle_id = config.tauri.bundle.identifier.as_str();
        
        if bundle_id.is_empty() {
            return Err("应用标识符未配置".to_string());
        }
        
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let run_key = match hkcu.open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            KEY_QUERY_VALUE,
        ) {
            Ok(key) => key,
            Err(_) => return Ok(false),
        };
        
        Ok(run_key.get_value::<String, _>(bundle_id).is_ok())
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("该平台暂不支持自启动功能".to_string())
    }
}

// 读取便签数据
#[tauri::command]
fn read_notes_data(app_handle: tauri::AppHandle) -> Result<String, String> {
    // 获取应用数据目录
    let app_data_dir = app_data_dir(&app_handle.config()).expect("无法获取应用数据目录");
    let notes_file_path = app_data_dir.join("notes.json");
    
    // 确保目录存在
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    
    // 如果文件存在，读取数据；否则返回空数组
    if notes_file_path.exists() {
        fs::read_to_string(notes_file_path).map_err(|e| e.to_string())
    } else {
        Ok("[]".to_string())
    }
}

// 保存便签数据
#[tauri::command]
fn save_notes_data(notes: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    // 获取应用数据目录
    let app_data_dir = app_data_dir(&app_handle.config()).expect("无法获取应用数据目录");
    let notes_file_path = app_data_dir.join("notes.json");
    
    // 确保目录存在
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    
    // 写入文件
    fs::write(notes_file_path, notes).map_err(|e| e.to_string())
}

// 自定义命令 - 更新全局快捷键
#[tauri::command]
fn update_global_shortcut(
    app_handle: tauri::AppHandle,
    shortcut: String,
) -> Result<(), String> {
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    
    // 先取消注册现有的快捷键
    if shortcut_manager.is_registered("CommandOrControl+Alt+N").unwrap_or(false) {
        shortcut_manager.unregister("CommandOrControl+Alt+N").map_err(|e| e.to_string())?;
    }
    
    // 注册新的快捷键
    let window_handle = app_handle.clone();
    shortcut_manager.register("CommandOrControl+Alt+N", move || {
        // 获取屏幕尺寸
        let mut monitor_size = PhysicalSize::new(1920, 1080); // 默认值
        
        // 创建临时窗口以获取屏幕尺寸
        if let Some(window) = window_handle.get_window("main") {
            if let Ok(Some(monitor)) = window.primary_monitor() {
                // 直接获取尺寸，不需要Option模式匹配
                monitor_size = *monitor.size();
            }
        }
        
        // 计算右下角位置 (距离右下角100像素)
        let window_width = 400.0;
        let window_height = 500.0;
        let x = (monitor_size.width as f64) - window_width - 100.0;
        let y = (monitor_size.height as f64) - window_height - 100.0;
        
        // 创建一个新的笔记窗口
        let window = WindowBuilder::new(
            &app_handle,
            "new-note", // 窗口标识符
            WindowUrl::App("/#/new-note".into()) // 这会路由到特定的新建便签页面
        )
        .title("新建便签")
        .position(x, y)
        .inner_size(window_width, window_height)
        .decorations(false) // 无边框窗口
        .center()
        .build()
        .unwrap();
        
        // 聚焦到新窗口
        window.set_focus().unwrap();
        
        // 也发送事件到主窗口, 通知创建新便签
        if let Some(main_window) = app_handle.get_window("main") {
            main_window.emit("create-new-note", {}).unwrap();
        }
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}

// 更新应用内快捷键设置
#[tauri::command]
fn update_app_shortcuts(shortcuts: serde_json::Value) -> Result<(), String> {
    // 这个函数只需要在前端实现，这里只是为了接口一致性
    Ok(())
}

// 截图功能 - 支持全局截图
#[tauri::command]
fn capture_screenshot(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    // 获取应用数据目录，用于保存截图
    let app_data_dir = app_data_dir(&app_handle.config()).expect("无法获取应用数据目录");
    let screenshots_dir = app_data_dir.join("screenshots");
    
    // 确保截图目录存在
    if !screenshots_dir.exists() {
        fs::create_dir_all(&screenshots_dir).map_err(|e| e.to_string())?;
    }
    
    // 在Windows上，实现全局截图功能
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        // 获取时间戳作为文件名
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let filename = format!("screenshot_{}.png", timestamp);
        let filepath = screenshots_dir.join(&filename);
        
        // 方法1: 尝试使用PowerShell截图 (这是Windows 10+的最佳方式)
        let ps_result = Command::new("powershell")
            .arg("-Command")
            .arg(&format!(
                "Add-Type -AssemblyName System.Windows.Forms; \
                 [System.Windows.Forms.SendKeys]::SendWait('^%{{PRTSC}}'); \
                 Start-Sleep -Milliseconds 500; \
                 $bitmap = [System.Windows.Forms.Clipboard]::GetImage(); \
                 if ($bitmap -ne $null) {{ \
                    $bitmap.Save('{}'); \
                    Write-Output 'success'; \
                 }} else {{ \
                    Write-Output 'failed'; \
                 }}", 
                 filepath.to_string_lossy()
            ))
            .output();
        
        // 检查PowerShell截图是否成功
        if let Ok(output) = ps_result {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.trim() == "success" && filepath.exists() {
                return Ok(serde_json::json!({
                    "path": filepath.to_str().unwrap_or(""),
                    "filename": filename
                }));
            }
        }
        
        // 方法2: 如果PowerShell方法失败，退回到打开文件选择对话框
        let selected_file = FileDialogBuilder::new()
            .add_filter("图片文件", &["png", "jpg", "jpeg", "gif", "bmp"])
            .set_title("选择一张图片或截图")
            .pick_file();
        
        if let Some(file_path) = selected_file {
            // 获取文件扩展名
            let extension = file_path
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("png");
            
            // 生成目标文件名 (时间戳+扩展名)
            let target_filename = format!("screenshot_{}.{}", timestamp, extension);
            let target_path = screenshots_dir.join(&target_filename);
            
            // 复制选择的文件到应用目录
            fs::copy(&file_path, &target_path).map_err(|e| e.to_string())?;
            
            // 返回相对路径，前端可以通过tauri://localhost/路径加载
            return Ok(serde_json::json!({
                "path": target_path.to_str().unwrap_or(""),
                "filename": target_filename
            }));
        } else {
            // 用户取消了文件选择
            return Err("用户取消了操作".to_string());
        }
    }
    
    // 对于非Windows平台，暂时仍使用文件选择对话框
    #[cfg(not(target_os = "windows"))]
    {
        let selected_file = FileDialogBuilder::new()
            .add_filter("图片文件", &["png", "jpg", "jpeg", "gif", "bmp"])
            .set_title("选择一张图片或截图")
            .pick_file();
        
        if let Some(file_path) = selected_file {
            // 获取文件扩展名
            let extension = file_path
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("png");
            
            // 生成目标文件名 (时间戳+扩展名)
            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            let target_filename = format!("screenshot_{}.{}", timestamp, extension);
            let target_path = screenshots_dir.join(&target_filename);
            
            // 复制选择的文件到应用目录
            fs::copy(&file_path, &target_path).map_err(|e| e.to_string())?;
            
            // 返回相对路径，前端可以通过tauri://localhost/路径加载
            return Ok(serde_json::json!({
                "path": target_path.to_str().unwrap_or(""),
                "filename": target_filename
            }));
        } else {
            // 用户取消了文件选择
            return Err("用户取消了操作".to_string());
        }
    }
}

// 自定义命令 - 最小化窗口
#[tauri::command]
fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

// 自定义命令 - 隐藏窗口
#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

fn main() {
    // 系统托盘设置
    let quit = CustomMenuItem::new("quit".to_string(), "退出");
    let show = CustomMenuItem::new("show".to_string(), "显示窗口");
    let autostart = CustomMenuItem::new("autostart".to_string(), "开机启动");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(autostart)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        // 添加系统托盘
        .system_tray(system_tray)
        // 注册自定义命令
        .invoke_handler(tauri::generate_handler![
            toggle_autostart,
            is_autostart_enabled,
            read_notes_data,
            save_notes_data,
            update_global_shortcut,
            update_app_shortcuts,
            capture_screenshot,
            minimize_window,
            hide_window
        ])
        // 处理系统托盘事件
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "autostart" => {
                    let item = app.tray_handle().get_item(&id);
                    
                    match is_autostart_enabled(app.app_handle()) {
                        Ok(enabled) => {
                            if enabled {
                                let _ = toggle_autostart(app.app_handle(), false);
                                let _ = item.set_title("开机启动");
                            } else {
                                let _ = toggle_autostart(app.app_handle(), true);
                                let _ = item.set_title("✓ 开机启动");
                            }
                        }
                        Err(_) => {}
                    }
                }
                _ => {}
            },
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        })
        // 设置应用启动时的处理
        .setup(|app| {
            // 设置全局快捷键
            let handle = app.handle();
            
            // 注册Ctrl+Alt+N快捷键创建新便签窗口
            let mut global_shortcut = app.global_shortcut_manager();
            global_shortcut.register("CommandOrControl+Alt+N", move || {
                // 获取屏幕尺寸
                let mut monitor_size = PhysicalSize::new(1920, 1080); // 默认值
                
                // 尝试获取屏幕尺寸
                if let Some(window) = handle.get_window("main") {
                    if let Ok(Some(monitor)) = window.primary_monitor() {
                        // 直接获取尺寸，不需要Option模式匹配
                        monitor_size = *monitor.size();
                    }
                }
                
                // 计算右下角位置 (距离右下角100像素)
                let window_width = 400.0;
                let window_height = 500.0;
                let x = (monitor_size.width as f64) - window_width - 100.0;
                let y = (monitor_size.height as f64) - window_height - 100.0;
                
                // 创建一个新的笔记窗口
                let _window = WindowBuilder::new(
                    &handle,
                    "new-note", // 窗口标识符
                    WindowUrl::App("/#/new-note".into()) // 这会路由到特定的新建便签页面
                )
                .title("新建便签")
                .position(x, y)
                .inner_size(window_width, window_height)
                .decorations(false) // 无边框窗口
                .build()
                .unwrap();
                
                // 发送事件到前端，通知创建新便签
                if let Some(main_window) = handle.get_window("main") {
                    main_window.emit("create-new-note", {}).unwrap();
                }
            })?;
            
            Ok(())
        })
        // 窗口事件处理
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // 关闭窗口时隐藏到托盘而不是真正关闭应用
                let window = event.window();
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

