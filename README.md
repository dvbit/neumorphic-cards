# Neumorphic Cards for Home Assistant

A suite of dependency-free, self-contained custom Lovelace cards with a consistent **neumorphic (soft-UI)** aesthetic, matching the [hacs-neumorphic-template](https://github.com/etnlbck/hacs-neumorphic-template) theme.

Every card ships with a full visual editor, raised / sunken / flat surface styles where applicable, parametric sizing, and complete typography controls for all labels. No external card dependencies.

## Cards in this suite

| Card | `type:` | Description |
|------|---------|-------------|
| Button | `custom:neumorphic-button-card` | Button with shape options, animations, glow, and status dot. — [simple](./examples/button-simple.yaml) · [complex](./examples/button-complex.yaml) |
| Slider | `custom:neumorphic-slider-card` | Linear horizontal / vertical slider. — [simple](./examples/slider-simple.yaml) · [complex](./examples/slider-complex.yaml) |
| Rotary Slider | `custom:neumorphic-rotary-slider` | Circular rotary knob with extensive parametric config. — [simple](./examples/rotary-simple.yaml) · [complex](./examples/rotary-complex.yaml) |
| Container | `custom:neumorphic-container-card` | Wrapper card with CSS-grid layout for child cards. — [simple](./examples/container-simple.yaml) · [complex](./examples/container-complex.yaml) |
| Calendar Grid | `custom:neumorphic-calendar-grid-card` | Month-grid calendar with today highlight, navigation, and tap-for-events. — [simple](./examples/calendar-simple.yaml) · [complex](./examples/calendar-complex.yaml) |
| Climate | `custom:neumorphic-climate-card` | Soft-UI thermostat with a gradient dial and full climate controls. — [simple](./examples/climate-simple.yaml) · [full](./examples/climate-full.yaml) |
| Media Player | `custom:neumorphic-media-player-card` | Now-playing card with circular album art, transport, progress, volume, shuffle/repeat. — [simple](./examples/media-player-simple.yaml) · [complex](./examples/media-player-complex.yaml) |
| Clock | `custom:neumorphic-clock-card` | Minimalist analog clock for a time entity, with a seconds hand and localized date caption. — [simple](./examples/clock-simple.yaml) · [complex](./examples/clock-complex.yaml) |
| Date Picker | `custom:datepicker-card` | Concentric disc-ring date picker. — [simple](./examples/datepicker-simple.yaml) · [complex](./examples/datepicker-complex.yaml) |
| Time Picker | `custom:timepicker-card` | Concentric disc-ring time picker. — [simple](./examples/timepicker-simple.yaml) · [complex](./examples/timepicker-complex.yaml) |

**📖 [Full parameter reference for every card →](./PARAMETERS.md)** · Copy-paste examples in [`examples/`](./examples).

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

### Climate examples

**Simple** — just point it at an entity; every supported control appears automatically:

```yaml
type: custom:neumorphic-climate-card
entity: climate.living_room
```

**Full** — all options, including per-element typography (font, size, weight, colour, transform, spacing):

```yaml
type: custom:neumorphic-climate-card
entity: climate.living_room
name: Living Room
card_size: 340
show_current_as_primary: false
show_unit_toggle: true
show_status_pill: true
show_modes: true
show_presets: true
show_fan: true
show_swing: true
show_humidity: true
accent_color: "#4aa3df"
title_label:
  text: Living Room
  font: Space Mono
  size: 13px
  weight: 700
  transform: uppercase
  spacing: 0.12em
  color: "#8a929e"
primary_label:
  font: Poppins
  size: 60px
  weight: 300
  color: "#8a929e"
secondary_label:
  font: Poppins
  size: 16px
  color: "#c3c9d2"
```

Full commented examples are in [`examples/`](./examples): [climate-simple.yaml](./examples/climate-simple.yaml) and [climate-full.yaml](./examples/climate-full.yaml).

Drag or tap the gradient ring to set the target temperature. Buttons for HVAC modes, presets, fan, and swing appear automatically for whatever the entity supports. The green pill beneath the dial shows the current HVAC action — tap it to toggle power.

#### Climate options

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** A `climate.*` entity. |
| `name` | friendly name | Header title override. |
| `card_size` | `320` | Base width in px (240–520). |
| `show_current_as_primary` | `false` | Show current temp as the big number, target as the small one. |
| `show_unit_toggle` | `false` | Show a °F/°C display toggle (visual only). |
| `show_status_pill` | `true` | Green HVAC-action pill under the dial; tap toggles power. |
| `show_modes` / `show_presets` / `show_fan` / `show_swing` | `true` | Show each control group (only if the entity supports it). |
| `show_humidity` | `true` | Humidity readout when the entity reports it. |
| `accent_color` | `#4aa3df` | Tints active preset/fan/swing buttons. |
| `no_border` | `false` | Transparent background, no card shadow. |
| `display_only` | `false` | Read-only: hides the handle, disables buttons. |
| `title_label`, `primary_label`, `secondary_label`, `group_label`, `chip_label`, `pill_label`, `humidity_label` | — | Per-element typography blocks (`show`, `text`, `font`, `size`, `weight`, `color`, `transform`, `spacing`). |

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
