#! /usr/bin/sh
SF=/usr/bin/scarfin
ADD_REMOVE=$1
TAG=$2

PLAYERDATA=$(playerctl metadata --format '{{ playerName }}:{{ xesam:url }}' --player="Gwenview")
if [[ $PLAYERDATA == Gwenview* ]]
then
    FILE=$(echo $PLAYERDATA | cut -f 3- -d':' | cut -c 3-)
    COMMAND="$SF tag $ADD_REMOVE $TAG -- $FILE"
    echo $COMMAND | tee -a ~/.scarfin/tag-logs.txt
    $COMMAND | tee -a ~/.scarfin/tag-logs.txt
    if [[ $ADD_REMOVE == add ]]
    then
        notify-send -t 3000 -u normal "Added - $TAG" "Scarfin added tag to $FILE"
    else
        notify-send -t 3000 -u normal "Removed - $TAG" "Scarfin removed tag from $FILE"
    fi
else
    echo "no file found -- check photo viewer/playerctl" | tee -a ~/.scarfin/tag-logs.txt
fi
