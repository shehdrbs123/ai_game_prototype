param(
    [Parameter(Mandatory = $true)]
    [string]$CommitItem,

    [Parameter(Mandatory = $true)]
    [string]$Summary,

    [Parameter(Mandatory = $true)]
    [string]$Reason,

    [Parameter(Mandatory = $true)]
    [string]$Changes,

    [Parameter(Mandatory = $true)]
    [string]$Impact
)

$header = "[$CommitItem] $Summary"
$message = @"
$header
- 변경 사유 : $Reason
- 변경 내용 : $Changes
- 영향성 : $Impact
"@

git commit -m $message
