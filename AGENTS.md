<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep 3D prototype comparison client-only and isolated from the live sensor hub; layout changes must not change BLE or demo readings.
- Normalize prototype geometry and future licensed GLB replacements to metres, Y-up, front +Z, centered at the pelvis/thigh junction; overlays use this shared frame for consistent placement.
- Keep garment geometry separate from prototype layout overlays so a licensed model can replace the procedural shell without rewriting controls or sensor definitions.
