import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bike,
  Building2,
  FileCheck2,
  IdCard,
  Loader2,
  Lock,
  ShieldCheck,
  Store,
  UploadCloud,
  UserRound,
  Wrench,
  Zap,
  Scooter,
} from "lucide-react";
import { toast } from "sonner";
import { PartnerShell } from "@/components/nextnab/PartnerShell";
import { Button } from "@/components/nextnab/Button";
import { StepIndicator } from "@/components/nextnab/StepIndicator";
import { LoadingState } from "@/components/nextnab/States";
import {
  ChoiceGrid,
  CheckboxRow,
  Field,
  FormSection,
  PhoneInput,
  SelectInput,
  TextInput,
} from "@/components/nextnab/Form";
import { useAuth } from "@/hooks/useAuth";
import {
  uploadKycFile,
  useSubmitPartnerApplication,
  type PartnerApplicationInput,
} from "@/hooks/usePartner";
import { BUSINESS_CATEGORIES, SERVICE_ROLES, isValidPhone } from "@/lib/partner-options";
import { fieldBase } from "@/components/nextnab/Form";
import type { PartnerType } from "@/types";

const title = "Partner registration — NextNab";
const description =
  "Register as a NextNab shop partner, home service professional or delivery rider in Latur. Quick 4-step onboarding.";

export const Route = createFileRoute("/partner/join")({
  validateSearch: (search: Record<string, unknown>): { type?: PartnerType | undefined } => {
    const value = search["type"];
    const valid: PartnerType[] = ["shopkeeper", "service_provider", "rider"];
    return { type: valid.includes(value as PartnerType) ? (value as PartnerType) : undefined };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerJoinPage,
});

const STEPS = ["Role", "Details", "Documents", "Review"] as const;

const TYPE_OPTIONS = [
  { value: "shopkeeper" as const, label: "Shop", icon: Store },
  { value: "service_provider" as const, label: "Service", icon: Wrench },
  { value: "rider" as const, label: "Rider", icon: Bike },
];

const VEHICLE_OPTIONS = [
  { value: "Scooter" as const, label: "Scooter", icon: Scooter },
  { value: "Bike" as const, label: "Bike", icon: Bike },
  { value: "Electric" as const, label: "Electric", icon: Zap },
];

type VehicleType = (typeof VEHICLE_OPTIONS)[number]["value"];

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Driving Licence", "Voter ID"] as const;

type Files = { idFront: File | null; idBack: File | null; proof: File | null };

function FileField({
  label,
  file,
  onPick,
  hint,
}: {
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-low px-4 py-3.5 text-sm transition-colors hover:border-brand">
        <UploadCloud className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <span className={file ? "truncate font-semibold" : "text-muted-foreground"}>
          {file ? file.name : "JPG, PNG or PDF — max 5 MB"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(event) => onPick(event.target.files?.[0] ?? null)}
        />
      </label>
    </Field>
  );
}

function PartnerJoinPage() {
  const { type: initialType } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const submit = useSubmitPartnerApplication();

  const [step, setStep] = useState(initialType ? 1 : 0);
  const [partnerType, setPartnerType] = useState<PartnerType | "">(initialType ?? "");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "Latur",
    business_name: "",
    business_category: "",
    business_address: "",
    gstin: "",
    service_category: "",
    experience: "",
    vehicle_type: "",
    vehicle_number: "",
    license_number: "",
    id_type: "",
    id_number: "",
  });
  const [files, setFiles] = useState<Files>({ idFront: null, idBack: null, proof: null });
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <PartnerShell title="Partner registration">
        <LoadingState label="Checking your account…" />
      </PartnerShell>
    );
  }

  if (!user) {
    return (
      <PartnerShell
        icon={Lock}
        title="Sign in to continue"
        subtitle="Your application is saved to your NextNab account"
      >
        <p className="text-center text-sm text-muted-foreground">
          Create a partner account (or sign in) first — it takes less than a minute, and your
          verification documents stay private to you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/partner/login">
            <Button>Partner login</Button>
          </Link>
          <Link to="/partner">
            <Button variant="outline">Back to partner home</Button>
          </Link>
        </div>
      </PartnerShell>
    );
  }

  function validateDetails() {
    if (!form.full_name.trim()) return "Enter your full name";
    if (!isValidPhone(form.phone)) return "Enter a valid 10-digit mobile number";
    if (partnerType === "shopkeeper") {
      if (!form.business_name.trim()) return "Enter your shop name";
      if (!form.business_category) return "Select your shop category";
      if (!form.business_address.trim()) return "Enter your shop address";
    }
    if (partnerType === "service_provider") {
      if (!form.service_category) return "Select your service category";
      if (!form.experience.trim()) return "Enter your years of experience";
    }
    if (partnerType === "rider") {
      if (!form.vehicle_type) return "Select your vehicle type";
      if (!form.vehicle_number.trim()) return "Enter your vehicle number";
      if (!form.license_number.trim()) return "Enter your driving licence number";
    }
    return null;
  }

  function next() {
    if (step === 0) {
      if (!partnerType) {
        toast.error("Choose how you want to partner with NextNab");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const error = validateDetails();
      if (error) {
        toast.error(error);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.id_type) {
        toast.error("Select your ID proof type");
        return;
      }
      if (!form.id_number.trim()) {
        toast.error("Enter your ID number");
        return;
      }
      if (!files.idFront) {
        toast.error("Upload the front of your ID proof");
        return;
      }
      setStep(3);
    }
  }

  async function handleSubmit() {
    if (!agreed) {
      toast.error("Please accept the partner terms to continue");
      return;
    }
    setUploading(true);
    try {
      const uploads: Record<string, string | null> = {
        id_front_url: null,
        id_back_url: null,
        business_proof_url: null,
      };
      if (files.idFront)
        uploads["id_front_url"] = await uploadKycFile(user!.id, "id-front", files.idFront);
      if (files.idBack)
        uploads["id_back_url"] = await uploadKycFile(user!.id, "id-back", files.idBack);
      if (files.proof)
        uploads["business_proof_url"] = await uploadKycFile(user!.id, "proof", files.proof);

      const payload: PartnerApplicationInput = {
        partner_type: partnerType as PartnerType,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim() || "Latur",
        business_name: form.business_name.trim() || null,
        business_category: form.business_category || null,
        business_address: form.business_address.trim() || null,
        gstin: form.gstin.trim() || null,
        service_category: form.service_category || null,
        experience: form.experience.trim() || null,
        vehicle_type: form.vehicle_type || null,
        vehicle_number: form.vehicle_number.trim() || null,
        license_number: form.license_number.trim() || null,
        id_type: form.id_type || null,
        id_number: form.id_number.trim() || null,
        id_front_url: uploads["id_front_url"] ?? null,
        id_back_url: uploads["id_back_url"] ?? null,
        business_proof_url: uploads["business_proof_url"] ?? null,
      };

      await submit.mutateAsync(payload);
      navigate({ to: "/partner/status" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your application");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || submit.isPending;

  return (
    <PartnerShell
      icon={ShieldCheck}
      title="Partner registration"
      subtitle="4 quick steps — we verify most applications within 48 hours"
    >
      <StepIndicator steps={STEPS} current={step} />

      <div className="mt-8 space-y-7">
        {step === 0 && (
          <FormSection icon={ShieldCheck} title="How do you want to partner?">
            <ChoiceGrid
              value={partnerType}
              onChange={(value) => setPartnerType(value)}
              options={TYPE_OPTIONS}
            />
            <p className="text-sm text-muted-foreground">
              {partnerType === "shopkeeper" &&
                "List your shop's products and receive grocery orders from customers near you."}
              {partnerType === "service_provider" &&
                "Receive home service bookings — you decide your visiting fee and working slots."}
              {partnerType === "rider" &&
                "Pick up and deliver NextNab orders across Latur, and earn for every trip."}
              {!partnerType && "Select one option to continue."}
            </p>
          </FormSection>
        )}

        {step === 1 && (
          <>
            <FormSection icon={UserRound} title="Your details">
              <Field label="Full name" required>
                <TextInput
                  value={form.full_name}
                  onChange={(event) => set("full_name")(event.target.value)}
                  placeholder="As per your ID proof"
                />
              </Field>
              <Field label="Mobile number" required>
                <PhoneInput
                  value={form.phone}
                  onChange={(event) => set("phone")(event.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="City" required>
                <TextInput
                  value={form.city}
                  onChange={(event) => set("city")(event.target.value)}
                />
              </Field>
            </FormSection>

            {partnerType === "shopkeeper" && (
              <FormSection icon={Building2} title="Shop details">
                <Field label="Shop name" required>
                  <TextInput
                    value={form.business_name}
                    onChange={(event) => set("business_name")(event.target.value)}
                    placeholder="e.g. Shaikh Kirana Stores"
                  />
                </Field>
                <Field label="Shop category" required>
                  <SelectInput
                    options={BUSINESS_CATEGORIES}
                    placeholder="Select category"
                    value={form.business_category}
                    onChange={(event) => set("business_category")(event.target.value)}
                  />
                </Field>
                <Field label="Shop address" required>
                  <textarea
                    rows={3}
                    value={form.business_address}
                    onChange={(event) => set("business_address")(event.target.value)}
                    placeholder="Shop no., street, landmark, Latur"
                    className={`${fieldBase} h-auto py-3`}
                  />
                </Field>
                <Field label="GSTIN" hint="Optional — add it if your shop is GST registered">
                  <TextInput
                    value={form.gstin}
                    onChange={(event) => set("gstin")(event.target.value.toUpperCase())}
                    placeholder="27ABCDE1234F1Z5"
                  />
                </Field>
              </FormSection>
            )}

            {partnerType === "service_provider" && (
              <FormSection icon={Wrench} title="Service details">
                <Field label="Service category" required>
                  <SelectInput
                    options={SERVICE_ROLES}
                    placeholder="Select your work"
                    value={form.service_category}
                    onChange={(event) => set("service_category")(event.target.value)}
                  />
                </Field>
                <Field label="Years of experience" required>
                  <TextInput
                    inputMode="numeric"
                    value={form.experience}
                    onChange={(event) => set("experience")(event.target.value)}
                    placeholder="e.g. 6"
                  />
                </Field>
              </FormSection>
            )}

            {partnerType === "rider" && (
              <FormSection icon={Bike} title="Vehicle details">
                <Field label="Vehicle type" required>
                  <ChoiceGrid
                    value={form.vehicle_type as VehicleType | ""}
                    onChange={(value) => set("vehicle_type")(value)}
                    options={VEHICLE_OPTIONS}
                  />
                </Field>
                <Field label="Vehicle number" required>
                  <TextInput
                    value={form.vehicle_number}
                    onChange={(event) => set("vehicle_number")(event.target.value.toUpperCase())}
                    placeholder="MH 24 AB 1234"
                  />
                </Field>
                <Field label="Driving licence number" required>
                  <TextInput
                    value={form.license_number}
                    onChange={(event) => set("license_number")(event.target.value.toUpperCase())}
                    placeholder="MH2420110012345"
                  />
                </Field>
              </FormSection>
            )}
          </>
        )}

        {step === 2 && (
          <FormSection icon={IdCard} title="Verification documents">
            <Field label="ID proof type" required>
              <SelectInput
                options={ID_TYPES}
                placeholder="Select ID proof"
                value={form.id_type}
                onChange={(event) => set("id_type")(event.target.value)}
              />
            </Field>
            <Field label="ID number" required>
              <TextInput
                value={form.id_number}
                onChange={(event) => set("id_number")(event.target.value.toUpperCase())}
                placeholder="Enter the number on your ID"
              />
            </Field>
            <FileField
              label="ID proof — front"
              file={files.idFront}
              onPick={(file) => setFiles((prev) => ({ ...prev, idFront: file }))}
            />
            <FileField
              label="ID proof — back"
              file={files.idBack}
              onPick={(file) => setFiles((prev) => ({ ...prev, idBack: file }))}
              hint="Optional for single-page IDs"
            />
            <FileField
              label={
                partnerType === "shopkeeper"
                  ? "Shop proof (licence / electricity bill)"
                  : partnerType === "rider"
                    ? "Vehicle RC copy"
                    : "Skill certificate"
              }
              file={files.proof}
              onPick={(file) => setFiles((prev) => ({ ...prev, proof: file }))}
              hint="Optional, but speeds up verification"
            />
            <p className="rounded-2xl bg-accent px-4 py-3 text-xs text-primary">
              Your documents are stored privately and are visible only to you and the NextNab
              verification team.
            </p>
          </FormSection>
        )}

        {step === 3 && (
          <FormSection icon={FileCheck2} title="Review & submit">
            <dl className="divide-y divide-border rounded-2xl border border-border">
              {[
                ["Partner type", TYPE_OPTIONS.find((o) => o.value === partnerType)?.label ?? "—"],
                ["Name", form.full_name],
                ["Mobile", `+91 ${form.phone}`],
                ["City", form.city],
                partnerType === "shopkeeper" && [
                  "Shop",
                  `${form.business_name} · ${form.business_category}`,
                ],
                partnerType === "shopkeeper" && ["Address", form.business_address],
                partnerType === "service_provider" && ["Service", form.service_category],
                partnerType === "service_provider" && ["Experience", `${form.experience} years`],
                partnerType === "rider" && [
                  "Vehicle",
                  `${form.vehicle_type} · ${form.vehicle_number}`,
                ],
                partnerType === "rider" && ["Licence", form.license_number],
                ["ID proof", `${form.id_type} · ${form.id_number}`],
                [
                  "Documents",
                  [files.idFront, files.idBack, files.proof].filter(Boolean).length + " uploaded",
                ],
              ]
                .filter((row): row is [string, string] => Array.isArray(row))
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-4 py-3 text-sm"
                  >
                    <dt className="font-semibold text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">{value || "—"}</dd>
                  </div>
                ))}
            </dl>

            <CheckboxRow checked={agreed} onChange={setAgreed}>
              I confirm the details above are correct and I accept the NextNab partner terms —
              genuine listings and pricing, respectful service, and NextNab's commission and
              settlement policy.
            </CheckboxRow>
          </FormSection>
        )}
      </div>

      <div className="mt-9 flex gap-3">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button size="lg" className="flex-1" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => void handleSubmit()} loading={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Submit application
          </Button>
        )}
      </div>
    </PartnerShell>
  );
}
