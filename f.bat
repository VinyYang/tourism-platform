@echo off
chcp 65001 > nul
echo 正在启动前端服务...
cd /d %~dp0frontend
npm start 