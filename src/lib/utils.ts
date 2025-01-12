// From https://github.com/notjuliet/pdsls

import { CredentialManager, XRPC } from "@atcute/client";

interface DidDoc {
  "@context": string[];
  id: string;
  alsoKnownAs: string[];
  verificationMethod: DidVerificationMethod[];
  service: DidService[];
}

interface DidVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

interface DidService {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export const resolveHandle = async (handle: string) => {
  const rpc = new XRPC({
    handler: new CredentialManager({ service: "https://public.api.bsky.app" }),
  });
  const res = await rpc.get("com.atproto.identity.resolveHandle", {
    params: { handle: handle },
  });
  return res.data.did;
};

const didPDSCache: Record<string, string> = {};
const didDocCache: Record<string, DidDoc> = {};
export const getPDS = async (did: string) => {
  if (did in didPDSCache) return didPDSCache[did];
  const res = await fetch(
    did.startsWith("did:web")
      ? `https://${did.split(":")[2]}/.well-known/did.json`
      : "https://plc.directory/" + did
  );

  return res.json().then((doc: DidDoc) => {
    for (const service of doc.service) {
      if (service.id === "#atproto_pds") {
        didPDSCache[did] = service.serviceEndpoint;
        didDocCache[did] = doc;
        return service.serviceEndpoint;
      }
    }
  });
};
