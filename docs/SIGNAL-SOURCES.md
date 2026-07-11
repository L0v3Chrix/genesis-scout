# Signal sources — Cuyahoga County launch (verified 2026-07-10)

## Ingested (public, queryable, no ToU restriction — automated query is intended use)
| Source | Access | Records | Signal |
|---|---|---|---|
| Cuyahoga Fiscal Office parcel/CAMA (ArcGIS L2) | arcgis_rest | 484K parcels | tax balance detected; absentee/entity/long-hold ownership |
| Cleveland Complaint Violation Notices (ArcGIS) | arcgis_rest | 31,640 | code violations, address+parcel level, since 2015 |
| Cleveland Current Condemnations (ArcGIS) | arcgis_rest | 2,444 | active condemnations — strong distress |
| (available, not yet wired) Delinquent_Parcels FeatureServer/24 | arcgis_rest | 4,277 | dedicated delinquency layer w/ foreclosure + cert-sold flags |
| (available) Cleveland Land Bank Available Parcels | arcgis_rest | 15,576 | disposition/adjacency |
| (available) Parcel_Fabric_Taxparcels FeatureServer/0 | arcgis_rest | 517,927 | full owner/mailing join backbone ("LAST, FIRST" format) |

## Compliance-gated (public records; automated collection PROHIBITED by ToS)
- **Probate (estates)** — probate.cuyahogacounty.gov: login-free search exists (ESTATE category,
  DECEDENT/EXECUTOR/etc. roles) but ToS bans robots/data-mining/commercial reuse.
  COMPLIANT BULK PATH: formal public-records request (Ohio R.C. 149.43) → join names to parcel owners.
- **Divorce/Domestic Relations** — via Clerk cpdocket: ToS bans query-URL construction + bulk mining;
  DV/stalking cases withheld by law. Same records-request path.
- **Sheriff foreclosure sales** — RealAuction site actively bot-blocked (verified 403) + docket ToS.
  Tax-foreclosure proxy available lawfully via the Delinquent_Parcels flags.

Platform rule (enforced in code + registry): crawler NEVER touches hosts whose ToS prohibits it —
those categories surface in-product as "manual lookup / records-request" entries with official links.

## Signal quality note
An obituary is not a lead; an estate with real property is. Probate signals, when acquired via
records request, join to parcels by owner-name match against the county parcel file (verified live:
owner format matches court party format).
