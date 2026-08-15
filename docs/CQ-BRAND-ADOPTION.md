# CraneQualified Brand Adoption

Rigging 101 consumes the approved CraneQualified brand locally. The brand source of truth is `C:\Users\RussGallivan\Github\cq-brand\approved`.

## Approved inputs

| Local file | Approved source | Version | SHA-256 |
| --- | --- | --- | --- |
| `assets/brand/cranequalified-dark-background.svg` | `approved/logos/cranequalified-dark-background.svg` | Brand 1.0.0 | `A067920A815CEBF178315A240B3307FE6A5B0B64A86D096B64BC7733593C7554` |
| `assets/brand/favicon.svg` | `approved/favicons/favicon.svg` | Brand 1.0.0 | `1F713427E9706991BD922116AF93EC8FF99BA5252FDBE5145D426A9CE77CFE0B` |
| `cq-design-tokens.css` | `approved/design-system/0.3.0/tokens/design-tokens.css` | Design system 0.3.0 | `C166483DE5A5873DC41B960278F9B5FA572CCD2CBA24A6229E39C1EA84FA547A` |

## Implementation notes

- The approved CraneQualified logo remains intact and links to `cranequalified.com`.
- MSC Safety Solutions appears as a separate text endorsement. It is not merged into or substituted for the approved CraneQualified mark.
- The cover uses the canonical brand navy (`#001b3f`) and blue (`#447fc5`). Small white-on-blue actions use an accessible darker blue (`#356cae`) derived for WCAG contrast. Gold remains reserved for training status and safety emphasis.
- All approved assets are served from this project; no remote brand CDN is used.
