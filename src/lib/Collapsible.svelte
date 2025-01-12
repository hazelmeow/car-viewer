<script lang="ts">
  import type { Snippet } from "svelte";

  export interface Props {
    label?: Snippet;
    children?: Snippet;
  }

  let { label, children }: Props = $props();

  let open = $state(false);

  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "\n") {
      open = !open;
    }
  };
</script>

<div class="box">
  <div
    class="row"
    onclick={() => (open = !open)}
    {onkeydown}
    role="button"
    aria-expanded={open}
    tabindex={0}
  >
    {@render label?.()}
    <div class="spacer"></div>
    <span class="icon">
      {#if open}
        ▼
      {:else}
        ▶
      {/if}
    </span>
  </div>

  <div class:hidden={!open}>
    {@render children?.()}
  </div>
</div>

<style>
  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .spacer {
    flex: 1;
  }

  .icon {
    margin-right: 4px;
    margin-bottom: 2px;
    user-select: none;
  }

  .hidden {
    display: none;
  }
</style>
