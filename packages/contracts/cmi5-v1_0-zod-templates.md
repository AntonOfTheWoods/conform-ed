# cmi5 schema notes

The cmi5 contract bundle models the Quartz course-structure XML surface:

- `Cmi5V1_0.CourseStructureDocument` — combined courseStructure document and keyword extension
- `Cmi5V1_0.CourseStructure` — course, objectives, and recursive AU/block tree
- `Cmi5V1_0.KeywordExtension` — keyword dictionary used by the extension examples

This bundle intentionally covers the XML data model from the spec artifacts; runtime xAPI launch/state/statement behavior stays in the cmi5 apps.
