# AirTable Trello Power-Up

## Description

Adds custom fields linked to an Airtable board to you Trello cards.

## Installation

Once you enabled the Power-Up, go into its Settings and click on "Authorize".
You will then be prompted to fill 3 fields
* `AirTable App` (or Board id, can be found [here](https://airtable.com/api))
* `AirTable Table name` (in the selected board, usually *Cards*)
* `AirTable API Key` (can be found [here](https://airtable.com/account))

Click `Save`. The Power-Up will verify your informations. If it's correct then you will be prompted to `Authorize NodeJS`. This will create *Webhooks* so that every time you create a new card or update its name or description, data will be updated accordingly in AirTable !

A new tab opens: Login to your Trello account and click `Allow`. Once your successfully authenticated the tab will close automatically and you'll be back on your Trello Board.
