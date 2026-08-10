# Neumorphic Cards — Full Parameter Reference

Every option for every card. `entity` is required where noted; everything else is optional and falls back to the default shown. Ready-to-copy examples for each card live in [`examples/`](./examples).

## Design tokens

All cards default to the [neumorphism design-system](https://github.com/bergside/awesome-design-skills/tree/HEAD/skills/neumorphism) tokens, and every value below remains overridable per card:

| Token | Value |
|-------|-------|
| Surface | `#E7E5E4` |
| Text | `#1E2938` |
| Primary / accent | `#006666` |
| Success | `#00A63D` |
| Warning | `#FE9900` |
| Danger | `#FF2157` |
| Font (primary) | Space Mono |
| Font (mono) | JetBrains Mono |

Shadows are derived from the surface (`#c5c3c2` dark, `#ffffff` light). Space Mono and JetBrains Mono load automatically inside each card.

---

## Common typography block

Several cards accept **label blocks** — nested objects that configure one piece of text. Unless a card's table says otherwise, a label block accepts:

| Field | Values | Description |
|-------|--------|-------------|
| `show` | `true` \| `false` | Hide the element entirely. |
| `text` | string | Override the auto text (where applicable). |
| `font` | any Google Font name | Loads automatically. Blank = theme font. |
| `size` | CSS size (`"14px"`, `"1.1rem"`) | Font size. |
| `weight` | `300`–`900` | Font weight. |
| `color` | `#RRGGBB` | Text colour. |
| `transform` | `none` \| `uppercase` \| `lowercase` \| `capitalize` | Text transform. |
| `spacing` | CSS length (`"0.06em"`) | Letter spacing. |

---

## Neumorphic Button — `custom:neumorphic-button-card`

[Simple](./examples/button-simple.yaml) · [Complex](./examples/button-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** Any toggleable/actionable entity. |
| `name` | friendly name | Used by the label. |
| `icon` | — | MDI icon (`mdi:lightbulb`). |
| `shape` | `round` | `round` \| `squircle` \| `square`. |
| `size` | `68` | Knob diameter in px. |
| `icon_size` | ~41% of `size` | Icon diameter in px. |
| `icon_on_color` | `#006666` | Icon colour when on. |
| `icon_off_color` | theme | Icon colour when off. |
| `icon_animation` | `none` | `none` \| `pulse` \| `spin` \| `bounce` \| `shake` \| `ping` \| `blink`. |
| `glow_intensity` | `1` | Glow around the knob when active (0–2). |
| `depth` | `1` | Neumorphic shadow depth multiplier. |
| `card_mode` | `default` | Rendering mode. |
| `show_dot` | `false` | Small status dot. |
| `display_only` | `false` | Read-only (no interaction). |
| `tap_action` | `toggle` | `toggle` \| `more-info` \| `navigate` \| `call-service` \| `none`. |
| `hold_action` | `none` | Same options as `tap_action`. |
| `hold_timeout` | `500` | Hold threshold in ms. |
| `service` / `service_data` | — | Explicit service call (overrides toggle). |
| `hold_service` / `hold_service_data` | — | Service to call on hold. |
| `label_major` | see below | Primary label block. |
| `label_minor` | see below | Secondary label block. |

**Button label blocks** (`label_major`, `label_minor`) use a slightly different schema:

| Field | Default (major / minor) | Description |
|-------|-------------------------|-------------|
| `visible` | `true` | Show the label. |
| `text` | `name` | Label text. |
| `position` | `bottom` | `top` \| `bottom` (major sets it; minor follows). |
| `font_size` | `13` / `10` | px. |
| `font_weight` | `600` / `400` | Weight. |
| `font_family` | theme | Font. |
| `font_style` | `normal` | `normal` \| `italic`. |
| `letter_spacing` | `0.04` / `0.07` | em. |
| `text_transform` | `none` / `uppercase` | Transform. |
| `color` | theme | Colour. |
| `opacity` | `0.85` / `0.50` | 0–1. |
| `align` | `center` | `left` \| `center` \| `right`. |
| `max_width` | `0` | px (0 = auto). |
| `truncate` | `true` | Ellipsis on overflow. |

---

## Neumorphic Slider — `custom:neumorphic-slider-card`

[Simple](./examples/slider-simple.yaml) · [Complex](./examples/slider-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** |
| `attribute` | — | Control an attribute instead of state (dropdown in editor). |
| `name` | — | Primary label (alias of `label_main`). |
| `orientation` | `vertical` | `vertical` \| `horizontal`. |
| `min` / `max` / `step` | `0` / `100` / `1` | Range. |
| `unit` | — | Value suffix (`%`). |
| `show_value` | `true` | Show the numeric value. |
| `show_range` | `true` | Show min/max captions. |
| `show_border` | `true` | Card border. |
| `show_icon_border` | `true` | Border around the icon box. |
| `display_only` | `false` | Read-only (hides thumb/track/range). |
| `use_theme_colors` | `false` | Pull all colours from HA theme vars. |
| `color` | `#006666` | Fill / accent colour. |
| `background_color` | `#E7E5E4` | Card background. |
| `shadow_dark` / `shadow_light` | rgba | Neumorphic shadows. |
| `text_color` / `label_color` | — | Value / label colours. |
| `fill_mode` | `solid` | `solid` \| `gradient`. |
| `fill_opacity` | `0.72` | 0–1. |
| `glow` | `true` | Glow on the fill. |
| `glow_size` / `glow_opacity` | `18` / `0.55` | Glow tuning. |
| `track_length` | `280` (V) / `0` (H) | px; 0 = stretch (horizontal). |
| `track_thickness` | `6` | px. |
| `track_radius` | `3` | px. |
| `thumb_thickness` | `46` (V) / `24` (H) | Across travel. |
| `thumb_length` | `24` (V) / `46` (H) | Along travel. |
| `thumb_shape` | `round` | `round` \| `squircle` \| `square`. |
| `thumb_shadow_size` | `5` | px. |
| `icon` | — | MDI icon. |
| `icon_color` | `color` | Icon colour. |
| `icon_size` | `46` / `38` | Icon box size. |
| `icon_box_radius` | `13` / `11` | px. |
| `icon_mdi_size` | `22` / `20` | Glyph size. |
| `icon_animation` | `none` | `none` \| `spin` \| `pulse` \| `bounce` \| `shake` \| `ping` \| `blink`. |
| `icon_animation_speed_min` / `_max` | `3.0` / `0.2` | Seconds at min / max value. |
| `card_radius` | `22` | px. |
| `card_padding` | axis default | CSS padding string. |
| `card_shadow_size` | `7` | px. |
| `header_gap` / `header_margin` / `footer_margin` | axis defaults | Spacing (px). |
| `label_position` | `start` | `start` \| `end`. |
| `label_main` / `label_minor` | — | Primary / secondary label text. |
| `font_name` / `font_value` / `font_range` | `0.76rem` / `1.05rem` / `0.68rem` | Font sizes. |
| `grip_lines` / `grip_width` / `grip_height` / `grip_gap` | `3` / `18` / `2` / `3.5` | Thumb grip lines. |

---

## Neumorphic Rotary Slider — `custom:neumorphic-rotary-slider`

[Simple](./examples/rotary-simple.yaml) · [Complex](./examples/rotary-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** |
| `attribute` | — | Control an attribute instead of state. |
| `label` | — | Heading text. |
| `min` / `max` / `step` | `0` / `100` / `1` | Range. |
| `unit` | — | Value suffix. |
| `service` | — | Service to write the value (`media_player.volume_set`). |
| `service_data_key` | `value` | Key the value is sent under. |
| `scale` | `1` | Multiply dial value before sending (e.g. `0.01`). |
| `value_position` | `below` | `below` \| `center`. |
| `value_label` | `{show,size,weight}` | Value text block. |
| `min_label` / `max_label` | `{show}` | Min/max caption blocks. |
| `zero_angle` | `0` | Dial zero: `0`=bottom, `90`=left, `180`=top, `270`=right. |
| `min_angle` | `45` | Degrees CW from zero for MIN. |
| `max_angle` | `315` | Degrees CW from zero for MAX. |
| `card_size` | `220` | px (100–400); everything scales from this. |
| `disc_radius` | auto | px override. |
| `handle_radius` | auto | px override. |
| `disc_3d` | `false` | Convex 3D shading on the disc. |
| `glow_intensity` | `0.65` | 0–1. |
| `glow_color` | theme | e.g. `#ff6b35`. |
| `markers` | `none` | `none` \| `ticks` \| `trail` \| `dots` \| `ghosts` \| `combined`. |
| `range_style` | `none` | `none` \| `progress` \| `dial_ticks`. |
| `dial_ticks` | `21` | Ticks for `dial_ticks` style. |
| `progress_color` | — | Progress arc colour / gradient start. |
| `progress_color_end` | — | Gradient end (omit for solid). |

---

## Neumorphic Container — `custom:neumorphic-container-card`

[Simple](./examples/container-simple.yaml) · [Complex](./examples/container-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `cards` | `[]` | **The child cards** (any Lovelace card configs). |
| `title` | `""` | Header title. |
| `icon` | `""` | MDI icon in the header. |
| `style` | `raised` | `raised` \| `sunken` \| `flat`. |
| `columns` | `1` | Grid columns for the children. |
| `gap` | `12` | Gap between children (px). |
| `padding` | `16` | Inner padding (px). |
| `radius` | `16` | Corner radius (px). |
| `collapsible` | `false` | Show a collapse/expand toggle. |
| `default_open` | `true` | Initial state when collapsible. |

---

## Neumorphic Calendar Grid — `custom:neumorphic-calendar-grid-card`

[Simple](./examples/calendar-simple.yaml) · [Complex](./examples/calendar-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entities` | `[]` | **Required.** One or more `calendar.*` entities (merged). |
| `title` | — | Header title (or use `title_label.text`). |
| `first_day` | `monday` | `monday` \| `sunday`. |
| `card_size` | `340` | px (260–520). |
| `accent_color` | `#006666` | Today / selected highlight. |
| `event_color` | `#006666` | Event dots & agenda accent. |
| `show_week_numbers` | `false` | ISO week column. |
| `show_agenda` | `true` | Events panel under the grid. |
| `no_border` | `false` | Transparent background. |
| `display_only` | `false` | Read-only. |
| `title_label` | — | Header title block. |
| `weekday_label` | — | Mon/Tue/… labels block. |
| `date_label` | — | Day-number block. |
| `agenda_label` | — | Agenda heading block. |

(Label blocks use the common typography schema at the top.)

---

## Neumorphic Climate — `custom:neumorphic-climate-card`

[Simple](./examples/climate-simple.yaml) · [Full](./examples/climate-full.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** A `climate.*` entity. |
| `name` | friendly name | Header title override. |
| `card_size` | `320` | px (240–520). |
| `show_current_as_primary` | `false` | Current temp big, target small. |
| `show_unit_toggle` | `false` | °F/°C display toggle (visual only). |
| `show_status_pill` | `true` | HVAC-action pill; tap toggles power. |
| `show_modes` / `show_presets` / `show_fan` / `show_swing` | `true` | Control groups (if the entity supports them). |
| `show_humidity` | `true` | Humidity readout. |
| `accent_color` | `#006666` | Tints active preset/fan/swing buttons. |
| `no_border` | `false` | Transparent background. |
| `display_only` | `false` | Read-only. |
| `title_label`, `primary_label`, `secondary_label`, `group_label`, `chip_label`, `pill_label`, `humidity_label` | — | Typography blocks (common schema). |

---

## Neumorphic Media Player — `custom:neumorphic-media-player-card`

[Simple](./examples/media-player-simple.yaml) · [Complex](./examples/media-player-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required** (or `entities`). The primary / default active `media_player.*`. |
| `entities` | — | List of `media_player.*` (strings, or `{entity, name, icon}`) offered by the switcher chips. The primary `entity` is included automatically. |
| `name` | `Playing` | Header centre label (or use `header_label.text`). |
| `card_size` | `340` | Base width in px (260–460). |
| `accent_color` | `#006666` | Progress fill, play icon, and active chip colour. |
| `art_shape` | `circle` | `circle` \| `squircle` \| `square`. |
| `spin_art` | `false` | Slowly rotate circular art while playing. |
| `show_player_switcher` | `true` | Chip row to switch which player the card controls (auto-hidden with a single player). |
| `show_grouping` | `true` | Header cast icon → panel to join/unjoin speakers (needs `GROUPING`). |
| `show_header` | `true` | Back / label / menu row. |
| `show_progress` | `true` | Progress bar + elapsed/total times (needs `media_duration`). |
| `show_volume` | `false` | Volume slider + mute (needs `VOLUME_SET`). |
| `show_shuffle_repeat` | `true` | Shuffle / repeat row (needs those features). |
| `show_source` | `false` | Source dropdown (needs `SELECT_SOURCE` + `source_list`). |
| `no_border` | `false` | Transparent background, no card shadow. |
| `display_only` | `false` | Art + info only; hides all controls. |
| `header_label`, `title_label`, `artist_label` | — | Typography blocks (common schema). |

The **player switcher** is a UI-only selection — tapping a chip changes which entity the card drives, without any service call. **Grouping** uses `media_player.join` / `media_player.unjoin` and lists only other players that also advertise the `GROUPING` feature. All other controls appear only when the active entity's `supported_features` advertises them, calling the standard services (`media_play_pause`, `media_next_track`, `media_previous_track`, `media_seek`, `volume_set`, `volume_mute`, `shuffle_set`, `repeat_set`, `select_source`). The header buttons open the entity's more-info dialog.

---

## Neumorphic Date Picker — `custom:datepicker-card`

[Simple](./examples/datepicker-simple.yaml) · [Complex](./examples/datepicker-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** An `input_datetime.*` entity (date). |
| `year_min` | current − 2 | Earliest selectable year. |
| `year_max` | current + 10 | Latest selectable year. |
| `hide_border` | `false` | Transparent background. |
| `holiday_entity` | — | A `calendar.*` entity to highlight holidays. |
| `holiday_color` | `#e07070` | Holiday highlight colour. |
| `label_major` | `{text:"Date", position:"top", …}` | Heading block. |
| `label_minor` | `{position:"bottom", …}` | Sub-heading block. |
| `value` | `{size:"1.3rem", weight:"900", …}` | Selected-date text block. |
| `icon` | `{name, position:"none", size, color}` | Optional icon (`position`: `none`\|`left`\|`right`). |

**Picker text blocks** accept: `text`, `position` (`top`/`bottom`/`none`), `font`, `size`, `weight`, `spacing`, `transform`, `color`.

---

## Neumorphic Time Picker — `custom:timepicker-card`

[Simple](./examples/timepicker-simple.yaml) · [Complex](./examples/timepicker-complex.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `entity` | — | **Required.** An `input_datetime.*` entity (time). |
| `am_pm` | `false` | `false` = 24h, `true` = 12h AM/PM. |
| `hide_border` | `false` | Transparent background. |
| `label_major` | `{text:"Time", position:"top", …}` | Heading block. |
| `label_minor` | `{position:"bottom", …}` | Sub-heading block. |
| `value` | `{size:"1.1rem", weight:"900", spacing:"1px"}` | Selected-time text block. |
| `ampm` | `{size:"0.55rem", weight:"800", …}` | AM/PM indicator block (when `am_pm: true`). |
| `icon` | `{name, position:"none", size, color}` | Optional icon. |

**Picker text blocks** accept: `text`, `position`, `font`, `size`, `weight`, `spacing`, `transform`, `color`.
