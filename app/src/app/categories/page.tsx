"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: number;
  name: string;
  description: string | null;
  externalId: number | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formExternalId, setFormExternalId] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setPageError(null);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setPageError("Categorieën konden niet worden geladen.");
      }
    } catch {
      setPageError("Categorieën konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormExternalId("");
    setFormDisplayOrder("0");
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const body: Record<string, unknown> = {
      name: formName,
      description: formDescription || undefined,
      displayOrder: parseInt(formDisplayOrder) || 0,
    };

    if (formExternalId) {
      const extId = parseInt(formExternalId);
      if (isNaN(extId) || extId <= 0) {
        setFormError("Joomla ID moet een positief geheel getal zijn");
        return;
      }
      body.externalId = extId;
    }

    try {
      if (editingId !== null) {
        const res = await fetch(`/api/categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Opslaan mislukt");
          return;
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Aanmaken mislukt");
          return;
        }
      }

      resetForm();
      loadCategories();
    } catch {
      setFormError("Netwerkfout");
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormExternalId(cat.externalId?.toString() || "");
    setFormDisplayOrder(cat.displayOrder.toString());
    setFormError(null);
    setShowForm(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Weet je zeker dat je deze categorie wilt deactiveren?"))
      return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) loadCategories();
    } catch {
      setPageError("Categorie kon niet worden gedeactiveerd.");
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) loadCategories();
    } catch {
      setPageError("Categorie kon niet worden geheractiveerd.");
    }
  };

  const active = categories.filter((c) => c.isActive);
  const inactive = categories.filter((c) => !c.isActive);

  return (
    <div className="min-h-screen">
      {/* Page Error */}
      {pageError && (
        <div className="mx-8 mt-4 px-4 py-3 border-2 border-[#ff2d2d] bg-[#ff2d2d]/10">
          <p className="font-[family-name:var(--font-body)] text-sm text-[#ff2d2d]">
            {pageError}
          </p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#444] bg-[#2a2a2a]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
            Categorieën Beheer
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[#888] uppercase tracking-widest mt-1">
            {active.length} actief — {inactive.length} inactief —{" "}
            {categories.length} totaal
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                     border-2 border-[#e8ff00] text-[#0a0a0a] bg-[#e8ff00]
                     hover:translate-x-0.5 hover:-translate-y-0.5
                     hover:shadow-[4px_4px_0_#f5f5f0] transition-all duration-100"
        >
          + Nieuwe categorie
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="px-8 py-5 border-b-2 border-[#e8ff00] bg-[#1a1a1a]">
          <h3 className="font-[family-name:var(--font-title)] text-sm font-bold uppercase tracking-wider mb-4">
            {editingId ? "Categorie bewerken" : "Nieuwe categorie toevoegen"}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_1fr_150px_100px] gap-4">
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  Naam
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wetenschap"
                  required
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  Beschrijving
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optioneel"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  Joomla ID
                </label>
                <input
                  type="number"
                  value={formExternalId}
                  onChange={(e) => setFormExternalId(e.target.value)}
                  placeholder="—"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  Volgorde
                </label>
                <input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
            </div>
            {formError && (
              <p className="text-[#ff2d2d] text-xs font-[family-name:var(--font-body)]">
                {formError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                           border-2 border-[#e8ff00] text-[#0a0a0a] bg-[#e8ff00]
                           hover:translate-x-0.5 hover:-translate-y-0.5
                           hover:shadow-[4px_4px_0_#f5f5f0] transition-all duration-100"
              >
                {editingId ? "Opslaan" : "Toevoegen"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                           border-2 border-[#444] text-[#888]
                           hover:border-[#f5f5f0] hover:text-[#f5f5f0] transition-all duration-100"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="px-8 py-5">
        {loading ? (
          <p className="text-[#888] text-sm font-[family-name:var(--font-body)]">
            Laden...
          </p>
        ) : categories.length === 0 ? (
          <p className="text-[#888] text-sm font-[family-name:var(--font-body)]">
            Geen categorieën geconfigureerd. Voeg een nieuwe categorie toe om te
            beginnen.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#444]">
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  #
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Naam
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Beschrijving
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Joomla ID
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="py-3 px-4 font-[family-name:var(--font-body)] text-xs text-[#555]">
                    {cat.displayOrder}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-[family-name:var(--font-title)] text-sm font-bold">
                      {cat.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#888]">
                      {cat.description || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#888] font-mono">
                      {cat.externalId ?? "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        inline-block px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider
                        border font-[family-name:var(--font-body)]
                        ${
                          cat.isActive
                            ? "border-[#00ff88] text-[#00ff88]"
                            : "border-[#ff2d2d] text-[#ff2d2d]"
                        }
                      `}
                    >
                      {cat.isActive ? "Actief" : "Inactief"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                   border border-[#444] text-[#888]
                                   hover:border-[#e8ff00] hover:text-[#e8ff00] transition-all duration-100"
                      >
                        Bewerken
                      </button>
                      {cat.isActive ? (
                        <button
                          onClick={() => handleDeactivate(cat.id)}
                          className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                     border border-[#444] text-[#888]
                                     hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-all duration-100"
                        >
                          Deactiveren
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(cat.id)}
                          className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                     border border-[#444] text-[#888]
                                     hover:border-[#00ff88] hover:text-[#00ff88] transition-all duration-100"
                        >
                          Activeren
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
