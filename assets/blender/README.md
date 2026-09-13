# Blender spreader teaching model

Generated with Blender 5.2.1 using `tools/build-spreader-visuals.py`. The editable source is `spreader-classroom.blend` (60-degree configuration). The script reproduces all ten web images, from 30 to 75 degrees in 5-degree increments. No Blender runtime is needed by learners.

The attachment span is 10 feet. The upper connection rises `(span/2) tan(angle)` above the end connections. Lower lines are vertical. Model dimensions represent an ideal static, symmetric classroom assembly, not a certified lifting device. Connector spheres are symbolic attachment centers; sling diameters, beam section, and load body are illustrative. Do not use this model to specify, fabricate, rate, or inspect equipment.

Gold shows upper slings; teal shows lower slings; orange arrows show opposing inward compression on the bar. Arrow length does not encode force magnitude. Perspective angles differ from true angles; the adjacent 2D force view is the geometric reference. Camera framing changes to keep the assembly visible. The existing calculator supplies all learner-facing values and configuration limits.

Content basis: Crane and Rigging Brain, `IPT Section 1 Rigging Section -1.docx` (Spreader Beams), and the existing reviewed symmetric-spreader classroom model in `learning-lab.js` / `rigging-core.js`. All 10 rendered configurations are cross-checked against that calculator by `tests/blender-visuals-test.js`.

This set contains conceptual assembly illustrations only. It does not replace the commissioned inspection photographs described in `PHOTOGRAPHY-ASSET-MANIFEST.md`.
