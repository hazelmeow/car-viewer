<script lang="ts">
  import type {
    ChangeEventHandler,
    KeyboardEventHandler,
  } from "svelte/elements";
  import { iterateAtpRepo } from "@atcute/car";
  import Collapsible from "./lib/Collapsible.svelte";
  import { getPDS, resolveHandle } from "./lib/utils";

  let bytes: Uint8Array | null = $state(null);

  let fetchInput: HTMLInputElement | null = null;
  let fetchError: string | null = $state(null);

  const onFileChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.currentTarget.files;

    if (files?.length) {
      bytes = await files[0].bytes();
    }
  };

  const onFetchInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      onFetchClicked();
    }
  };

  const onFetchClicked = async () => {
    const input = fetchInput?.value;
    if (!input) return;

    fetchError = null;
    fetchFromPds(input);
  };

  const fetchFromPds = async (input: string) => {
    try {
      // From https://github.com/notjuliet/pdsls
      const uri = input
        .replace("at://", "")
        .replace("https://bsky.app/profile/", "");
      const uriParts = uri.split("/");
      const actor = uriParts[0];
      const did = uri.startsWith("did:") ? actor : await resolveHandle(actor);

      const pds = await getPDS(did);
      if (!pds) {
        fetchError = "failed to get pds";
        return;
      }

      const res = await fetch(
        pds + `/xrpc/com.atproto.sync.getRepo?did=${did}`
      ).then((r) => r.bytes());
      bytes = res;
    } catch (e) {
      fetchError = (e as any).toString();
    }
  };

  type Collection = {
    type: string;
    records: Record<string, unknown>;
  };

  const collections = $derived.by(() => {
    if (!bytes) return null;

    const collections: Collection[] = [];

    for (const { collection, rkey, record } of iterateAtpRepo(bytes)) {
      let c = collections.find((c) => c.type === collection);
      if (!c) {
        c = {
          type: collection,
          records: {},
        };
        collections.push(c);
      }
      c.records[rkey] = record;
    }

    collections.sort((a, b) => a.type.localeCompare(b.type));

    return collections;
  });
</script>

<main>
  <h1>car-viewer</h1>

  <div class="box input-row">
    <div class="box">
      <div class="mb">
        <strong>fetch from PDS</strong>
      </div>
      <input
        type="text"
        onkeydown={onFetchInputKeyDown}
        bind:this={fetchInput}
      />
      <button onclick={onFetchClicked}>fetch</button>
      {#if fetchError}
        <div>
          {fetchError}
        </div>
      {/if}
    </div>
    <span>or</span>
    <div class="box">
      <div class="mb">
        <strong>upload</strong>
      </div>
      <input type="file" onchange={onFileChange} />
    </div>
  </div>

  {#if collections}
    {#each collections as c}
      <Collapsible>
        {#snippet label()}
          <span>
            <strong>{c.type}</strong> ({Object.keys(c.records).length} record{Object.keys(
              c.records
            ).length && "s"})
          </span>
        {/snippet}

        <div class="list">
          {#each Object.entries(c.records) as [k, r]}
            <div class="box">
              <div><strong>{k}</strong></div>
              <pre>{JSON.stringify(r, null, 4)}</pre>
            </div>
          {/each}
        </div>
      </Collapsible>
    {/each}
  {/if}
</main>

<style>
  main {
    width: 800px;
    margin: 32px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h1 {
    margin: 0;
  }

  .input-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .input-row > div {
    display: inline;
    flex: 1;
  }
  .input-row > span {
    padding: 0px 16px;
    text-decoration: underline;
  }

  .mb {
    margin-bottom: 8px;
  }

  pre {
    overflow-x: scroll;
    margin: 0;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
</style>
