!macro customInit
    ; Delete any previous uninstall registry key to ensure the installer doesn't hang at 30%
    ; https://github.com/electron-userland/electron-builder/issues/4057#issuecomment-557570476
    ; https://github.com/electron-userland/electron-builder/issues/4092
    DeleteRegKey HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{${UNINSTALL_APP_KEY}}"
    DeleteRegKey HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
!macroend