@echo off
echo Restarting ETP Punch Display Service...

:: Run the restart command
node D:\Ujjawal\visitor_Display_iob\backend\ETP_PunchDisplayService.js restart

echo ETP Punch Display Service restarted successfully.
pause
