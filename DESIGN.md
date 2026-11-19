# Leonida Route Map design system

Built from the user's pinned highway-atlas direction. The screen is an offline checklist first; the road metaphor is confined to typography, color, grade shields and the staged roadmap.

## Tokens

Sign green #174c3b; dark green #103b2e; reflective paper #f3f4ee; asphalt ground #d9ddd8; ink #24352f; secondary ink #516159; rules #b8c3ba; warning coral #a33124 on #fbe3d9.

Signage type: Bahnschrift, DIN Alternate, Arial Narrow, sans-serif, as requested. Tabular numerals for progress and counts. Type sizes: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 27, 29, 30 px. Main trophy names 19 px, guide prose 17 px, warnings 14–16 px. No downloaded fonts.

## Components

Square buttons and input fields. Selected filters use green fill, while the missable filter uses coral. Earned rows use pale green plus an explicit checkbox and text. Story protection masks the actual name, description and guide until earned or individually revealed. Focus is a 3 px coral outline with 3 px offset.

Grade shields are original SVG paths filled bronze #77513b, silver #52636b, gold #846311 or platinum #174c3b. Color never acts alone: every badge carries its grade initial and accessible grade name.

## Layout and behavior

1280 px desktop captures: compact masthead and grade progress, tabs, checkpoint notice, filters, then checklist and sticky guide in a 1.48:1 split. Four route exits use a two-column grid; each exposes its ordered trophies through native details. Below 720 px, the selected guide stacks before the checklist and the roadmap becomes a single column. Functional text is at least 11 px. No animation, decorative gradients, cards with rounded corners, halos or remote media.

## Verification and provenance

Screenshots are direct, unedited headless Chrome JPEG captures produced by tools/capture.mjs at 1280×800 with sample earned IDs 2, 15 and 35. Three development rounds preceded the shipping capture. No game artwork, external imagery or generated raster assets are shipped. Source citations are ordinary external links that open only when clicked. Browser tests cover 390 px overflow, storage, filters, spoilers, import/export and absence of remote requests; mechanical detector findings were fixed before delivery.
