@echo off
chcp 65001 > nul
echo 正在启动后端服务...

echo 尝试清除已占用的端口进程...
setlocal enabledelayedexpansion

:: 获取占用3001端口的进程PID
set "found_pid=false"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="0" (
        set "found_pid=true"
        echo 发现进程 %%a 占用端口3001，尝试终止...
        taskkill /F /PID %%a 2>nul
        if !errorlevel! equ 0 (
            echo 进程 %%a 已成功终止
        ) else (
            echo 尝试使用管理员权限终止进程 %%a ...
            powershell -Command "Start-Process cmd -ArgumentList '/c taskkill /F /PID %%a' -Verb RunAs" 2>nul
            timeout /t 2 >nul
        )
    )
)

:: 检查端口是否已释放
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="0" (
        echo 警告: 端口3001仍被进程 %%a 占用，可能需要手动终止
    )
)

:: 等待一小段时间确保端口完全释放
timeout /t 2 >nul
echo 准备启动后端服务...

cd /d %~dp0backend
npm run dev 