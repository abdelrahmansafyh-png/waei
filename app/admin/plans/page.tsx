"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  period: string;
  billing_cycle: string;
  duration_days: number;
  max_children: number;
  features: string[];
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  currency: "ر.ق",
  period: "شهريًا",
  billing_cycle: "monthly",
  duration_days: 30,
  max_children: 1,
  features: "",
  is_featured: false,
  is_active: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setPlans((data as Plan[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name || "",
      description: plan.description || "",
      price: plan.price || "",
      currency: plan.currency || "ر.ق",
      period: plan.period || "شهريًا",
      billing_cycle: plan.billing_cycle || "monthly",
      duration_days: plan.duration_days || 30,
      max_children: plan.max_children || 1,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      is_featured: !!plan.is_featured,
      is_active: !!plan.is_active,
    });
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();

    const featuresArray = form.features
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      currency: form.currency,
      period: form.period,
      billing_cycle: form.billing_cycle,
      duration_days: Number(form.duration_days),
      max_children: Number(form.max_children),
      features: featuresArray,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    const { error } = editingId
      ? await supabase
          .from("subscription_plans")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("subscription_plans").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    fetchPlans();
  }

  async function toggleActive(plan: Plan) {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchPlans();
  }

  async function deletePlan(id: string) {
    if (!confirm("هل أنت متأكد من حذف الخطة؟")) return;

    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchPlans();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black text-[#0B4D6B]">
              إدارة الاشتراكات
            </h1>
            <p className="mt-3 text-[#6E7A99]">
              إضافة وتعديل الخطط، مدة الاشتراك، وعدد الأطفال المسموح.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="rounded-full bg-[#0B4D6B] px-6 py-3 font-black text-white"
          >
            إضافة خطة جديدة
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[#0B4D6B]">
              {editingId ? "تعديل الخطة" : "إضافة خطة"}
            </h2>

            <form onSubmit={savePlan} className="space-y-4">
              <input
                required
                placeholder="اسم الخطة"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
              />

              <textarea
                placeholder="وصف الخطة"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="h-28 w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="السعر"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
                />

                <input
                  placeholder="العملة"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.billing_cycle}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({
                      ...form,
                      billing_cycle: value,
                      period:
                        value === "monthly"
                          ? "شهريًا"
                          : value === "yearly"
                          ? "سنويًا"
                          : "مخصص",
                      duration_days:
                        value === "monthly"
                          ? 30
                          : value === "yearly"
                          ? 365
                          : form.duration_days,
                    });
                  }}
                  className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                  <option value="custom">مخصص</option>
                </select>

                <input
                  type="number"
                  min={1}
                  placeholder="مدة الاشتراك بالأيام"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_days: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
                />
              </div>

              <input
                type="number"
                min={1}
                placeholder="عدد الأطفال المسموح"
                value={form.max_children}
                onChange={(e) =>
                  setForm({ ...form, max_children: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
              />

              <textarea
                placeholder={`المميزات\nكل ميزة بسطر`}
                value={form.features}
                onChange={(e) =>
                  setForm({ ...form, features: e.target.value })
                }
                className="h-36 w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 rounded-2xl bg-[#F4FAF8] p-4 font-bold">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({ ...form, is_featured: e.target.checked })
                    }
                  />
                  الأكثر اختيارًا
                </label>

                <label className="flex items-center gap-3 rounded-2xl bg-[#F4FAF8] p-4 font-bold">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                  />
                  مفعلة
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#42BFA8] py-4 font-black text-white"
              >
                {editingId ? "حفظ التعديل" : "حفظ الخطة"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-full bg-gray-100 py-4 font-black text-[#0B4D6B]"
                >
                  إلغاء التعديل
                </button>
              )}
            </form>
          </div>

          <div>
            {loading ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                جاري التحميل...
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                لا توجد خطط
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-[2rem] p-8 shadow-xl ${
                      plan.is_featured
                        ? "bg-[#0B4D6B] text-white"
                        : "bg-white text-[#0B4D6B]"
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      {plan.is_featured ? (
                        <div className="inline-flex rounded-full bg-[#D8F36A] px-4 py-2 text-sm font-black text-[#0B4D6B]">
                          الأكثر اختيارًا
                        </div>
                      ) : (
                        <div />
                      )}

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          plan.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {plan.is_active ? "مفعلة" : "مخفية"}
                      </div>
                    </div>

                    <h2 className="text-3xl font-black">{plan.name}</h2>

                    <p
                      className={`mt-3 leading-8 ${
                        plan.is_featured ? "text-white/70" : "text-[#6E7A99]"
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span
                        className={
                          plan.is_featured ? "text-white/60" : "text-[#6E7A99]"
                        }
                      >
                        {plan.currency} / {plan.period}
                      </span>
                    </div>

                    <div
                      className={`mt-5 grid grid-cols-2 gap-3 text-sm font-black ${
                        plan.is_featured ? "text-white" : "text-[#0B4D6B]"
                      }`}
                    >
                      <div className="rounded-2xl bg-black/5 p-3">
                        المدة: {plan.duration_days} يوم
                      </div>
                      <div className="rounded-2xl bg-black/5 p-3">
                        الأطفال: {plan.max_children}
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      {plan.features?.map((feature, index) => (
                        <div
                          key={`${feature}-${index}`}
                          className="flex items-center gap-3"
                        >
                          <span>✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                      <button
                        onClick={() => startEdit(plan)}
                        className="rounded-full bg-[#42BFA8] py-3 font-black text-white"
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() => toggleActive(plan)}
                        className="rounded-full bg-yellow-100 py-3 font-black text-[#0B4D6B]"
                      >
                        {plan.is_active ? "إخفاء" : "تفعيل"}
                      </button>

                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="rounded-full bg-red-50 py-3 font-black text-red-600"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}