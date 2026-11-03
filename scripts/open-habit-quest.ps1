# Opens the Habit Quest app window unless one is already open. Run by the "Habit Quest auto-open" scheduled task
# (see install-autostart.ps1) at sign-in, unlock, wake and 9:30 AM.
$ErrorActionPreference = 'Stop'
$url = 'https://marloche.github.io/Habit-Quest/'

Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class HqWindows {
  delegate bool Visit(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] static extern bool EnumWindows(Visit v, IntPtr p);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static bool Open(string title) {
    bool found = false;
    EnumWindows((h, p) => {
      if (!IsWindowVisible(h)) return true;
      var s = new StringBuilder(256);
      GetWindowText(h, s, 256);
      found = s.ToString() == title;
      return !found;
    }, IntPtr.Zero);
    return found;
  }
}
'@

# The app window's title is exactly the page title; a browser tab shows "Habit Quest - Google Chrome", so it doesn't count.
if ([HqWindows]::Open('Habit Quest')) { exit 0 }

# Prefer the installed app (Chrome's Start-menu shortcut); without it, an app window in the same Chrome profile
# uses the same save, so it's a fine fallback.
$programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$app = Get-ChildItem $programs -Recurse -Filter 'Habit Quest*.lnk' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($app) { Start-Process $app.FullName }
else { Start-Process "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" "--app=$url" }
