# Neumorphic Cards for Home Assistant

A suite of dependency-free, self-contained custom Lovelace cards with a consistent **neumorphic (soft-UI)** aesthetic, matching the [hacs-neumorphic-template](https://github.com/etnlbck/hacs-neumorphic-template) theme.

Every card ships with a full visual editor, raised / sunken / flat surface styles where applicable, parametric sizing, and complete typography controls for all labels. No external card dependencies.

## Cards in this suite

| Card | `type:` | Description |
|------|---------|-------------|
| Button | `custom:neumorphic-button-card` | Button with shape options, animations, glow, and status dot. |
| Slider | `custom:neumorphic-slider-card` | Linear horizontal / vertical slider. |
| Rotary Slider | `custom:neumorphic-rotary-slider` | Circular rotary knob with extensive parametric config. |
| Container | `custom:neumorphic-container-card` | Wrapper card with CSS-grid layout for child cards. |
| Calendar Grid | `custom:neumorphic-calendar-grid-card` | Month-grid calendar with today highlight, navigation, and tap-for-events. |
| Date Picker | `custom:datepicker-card` | Concentric disc-ring date picker. |
| Time Picker | `custom:timepicker-card` | Concentric disc-ring time picker. |

All seven cards are shipped in a single bundled file, so **installing the repo registers every card automatically** — no manual resource setup.

## Installation

### HACS (recommended)

1. In HACS, go to **Frontend** → three-dot menu → **Custom repositories**.
2. Add `https://github.com/dvbit/neumorphic-cards` with category **Dashboard**.
3. Search for **Neumorphic Cards**, install, and reload when prompted.
4. Hard-refresh your browser. All seven cards now appear in the card picker with previews — nothing else to configure.

### Manual

1. Copy [`dist/neumorphic-cards.js`](./dist/neumorphic-cards.js) into `config/www/` on your Home Assistant instance.
2. Add it as a single dashboard resource (**Settings → Dashboards → three-dot menu → Resources → Add Resource**):

```yaml
url: /local/neumorphic-cards.js
type: module
```

3. Hard-refresh the browser. That one resource registers all seven cards.

> Prefer individual files? Each card is also available standalone in [`dist/`](./dist) (e.g. `dist/neumorphic-button-card.js`). If you go that route, add a resource for each card you use.

## Usage

Add any card through the dashboard UI — each appears in the card picker with a live preview and a full visual editor. Or configure in YAML.

### Calendar Grid example

```yaml
type: custom:neumorphic-calendar-grid-card
entities:
  - calendar.personal
  - calendar.work
first_day: monday
card_size: 340
accent_color: "#006666"
event_color: "#006666"
show_week_numbers: false
show_agenda: true
```

### Button example

```yaml
type: custom:neumorphic-button-card
entity: light.living_room
style: raised
```

## Theming

These cards read the standard Home Assistant `ha-card` CSS variables and adapt automatically to light and dark modes. They pair naturally with the [hacs-neumorphic-template](https://github.com/etnlbck/hacs-neumorphic-template) theme but do not require it.

## Development

Each card is a self-contained file in [`dist/`](./dist). To rebuild the combined bundle after editing any card:

```bash
./build.sh
```

This wraps each card in its own IIFE and concatenates them into `dist/neumorphic-cards.js`.

## License

[MIT](./LICENSE)
