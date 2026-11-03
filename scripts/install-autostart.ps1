# Registers the "Habit Quest auto-open" scheduled task for the current user (no admin needed).
# It runs open-habit-quest.ps1 at sign-in, on unlock, on wake from sleep and daily at the given time.
# Remove it with:  Unregister-ScheduledTask -TaskName 'Habit Quest auto-open' -Confirm:$false
param([string]$At = '09:30')
$ErrorActionPreference = 'Stop'

$user = "$env:USERDOMAIN\$env:USERNAME"
$script = Join-Path $PSScriptRoot 'open-habit-quest.ps1'
$start = (Get-Date -Format 'yyyy-MM-dd') + "T${At}:00"
# conhost --headless runs PowerShell with no console window flashing up.
$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Opens Habit Quest if it isn't open: at sign-in, unlock, wake and $At.</Description></RegistrationInfo>
  <Triggers>
    <LogonTrigger><Enabled>true</Enabled><UserId>$user</UserId><Delay>PT15S</Delay></LogonTrigger>
    <SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>SessionUnlock</StateChange><UserId>$user</UserId><Delay>PT3S</Delay></SessionStateChangeTrigger>
    <EventTrigger>
      <Enabled>true</Enabled>
      <Subscription>&lt;QueryList&gt;&lt;Query Id="0" Path="System"&gt;&lt;Select Path="System"&gt;*[System[Provider[@Name='Microsoft-Windows-Power-Troubleshooter'] and EventID=1]]&lt;/Select&gt;&lt;/Query&gt;&lt;/QueryList&gt;</Subscription>
      <Delay>PT5S</Delay>
    </EventTrigger>
    <CalendarTrigger><StartBoundary>$start</StartBoundary><Enabled>true</Enabled><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>
  </Triggers>
  <Principals><Principal id="Author"><UserId>$user</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT1M</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>conhost.exe</Command>
      <Arguments>--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$script"</Arguments>
    </Exec>
  </Actions>
</Task>
"@
Register-ScheduledTask -TaskName 'Habit Quest auto-open' -Xml $xml -Force | Out-Null
"Registered 'Habit Quest auto-open': sign-in, unlock, wake and daily at $At."
