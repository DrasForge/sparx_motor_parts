@echo off
set dbUser=root
set dbPass=
set dbName=gpos_db
set backupFile=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.sql

echo Backing up database %dbName%...
mysqldump -u %dbUser% %dbName% > "%~dp0..\%backupFile%"

if %errorlevel% equ 0 (
    echo Backup successful: %backupFile%
) else (
    echo Backup failed!
)
pause
