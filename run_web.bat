@echo off
start "Backend Server" cmd /k "cd backend && npm start"
start "Frontend Server" cmd /k "cd frontend && npm run dev"
