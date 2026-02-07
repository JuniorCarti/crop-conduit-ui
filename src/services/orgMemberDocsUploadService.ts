import { uploadToR2WithKey } from "@/services/r2UploadService";

export type OrgMemberDocType = "id_front" | "id_back" | "mpesa_statement";

export async function uploadOrgMemberDoc(params: {
  orgId: string;
  memberRef: string;
  docType: OrgMemberDocType;
  file: File;
}) {
  const timestamp = Date.now();
  const safeName = params.file.name.replace(/\s+/g, "_");
  const key = `orgs/${params.orgId}/members/${params.memberRef}/${params.docType}/${timestamp}_${safeName}`;
  const result = await uploadToR2WithKey(params.file, key);
  return {
    ...result,
    uploadedAt: new Date().toISOString(),
    fileName: params.file.name,
  };
}
