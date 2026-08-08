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

## Installation

### HACS (recommended)

1. In HACS, go to **Frontend** → three-dot menu → **Custom repositories**.
2. Add this repository URL with category **Dashboard** (Lovelace).
3. Search for **Neumorphic Cards** and install.
4. HACS registers the primary resource automatically. Because this is a multi-card suite, add the resources for the cards you use (see below).

### Manual

1. Copy the `.js` files you want from [`dist/`](./dist) into `config/www/` on your Home Assistant instance.
2. Add each as a dashboard resource (**Settings → Dashboards → three-dot menu → Resources**):

```yaml
url: /local/neumorphic-button-card.js
type: module
```

Resource URLs for every card:

```yaml
- url: /local/neumorphic-button-card.js
  type: module
- url: /local/neumorphic-slider-card.js
  type: module
- url: /local/neumorphic-rotary-slider.js
  type: module
- url: /local/neumorphic-container-card.js
  type: module
- url: /local/neumorphic-calendar-grid-card.js
  type: module
- url: /local/datepicker-card.js
  type: module
- url: /local/timepicker-card.js
  type: module
```

> When installed via HACS, replace `/local/` with the path HACS assigns (usually `/hacsfiles/neumorphic-cards/`).

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

## License

[MIT](./LICENSE)
