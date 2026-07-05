"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GripVertical, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";

import { CreateItemSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem as SelectOption,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemDTO, ItemScope, ItemType } from "@/types";

type ItemFormValues = { itemName: string; itemType: ItemType; scope: ItemScope };

const ITEM_TYPE_ORDER: ItemType[] = [
  "earning",
  "otherEarning",
  "statutoryDeduction",
  "deduction",
];

const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  earning: "支給",
  otherEarning: "その他支給",
  statutoryDeduction: "法定控除",
  deduction: "控除",
};

const SCOPE_LABEL: Record<ItemScope, string> = {
  salary: "給与",
  bonus: "賞与",
  both: "両方",
};

export function ItemManager({ items: initialItems }: { items: ItemDTO[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(CreateItemSchema.pick({ itemName: true, itemType: true, scope: true })),
    defaultValues: { itemName: "", itemType: "earning", scope: "both" },
  });

  async function persistOrder(reordered: ItemDTO[]) {
    setItems(reordered);
    await Promise.all(
      reordered.map((item, index) =>
        fetch(`/api/items/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: index }),
        })
      )
    );
    router.refresh();
  }

  async function handleDragEndForCategory(category: ItemType, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryItems = items.filter((i) => i.itemType === category);
    const oldIndex = categoryItems.findIndex((i) => i.id === active.id);
    const newIndex = categoryItems.findIndex((i) => i.id === over.id);
    const reorderedCategory = arrayMove(categoryItems, oldIndex, newIndex);

    const reordered = ITEM_TYPE_ORDER.flatMap((type) =>
      type === category ? reorderedCategory : items.filter((i) => i.itemType === type)
    );

    await persistOrder(reordered);
  }

  async function handleToggleActive(item: ItemDTO) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    router.refresh();
  }

  async function onSubmit(values: ItemFormValues) {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("項目の追加に失敗しました");
      return;
    }
    const created: ItemDTO = await res.json();
    setItems((prev) => [...prev, created]);
    toast.success("項目を追加しました");
    reset();
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              項目を追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>項目を追加</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="itemName">項目名</Label>
                <Input id="itemName" {...register("itemName")} />
                {errors.itemName && <p className="text-sm text-destructive">{errors.itemName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemType">種別</Label>
                <Controller
                  control={control}
                  name="itemType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="itemType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPE_ORDER.map((type) => (
                          <SelectOption key={type} value={type}>
                            {ITEM_TYPE_LABEL[type]}
                          </SelectOption>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scope">適用範囲</Label>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="scope" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectOption value="salary">給与のみ</SelectOption>
                        <SelectOption value="bonus">賞与のみ</SelectOption>
                        <SelectOption value="both">両方</SelectOption>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                追加する
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {ITEM_TYPE_ORDER.map((category) => {
          const categoryItems = items.filter((i) => i.itemType === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {ITEM_TYPE_LABEL[category]}
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEndForCategory(category, event)}
              >
                <SortableContext
                  items={categoryItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <SortableItemRow key={item.id} item={item} onToggleActive={handleToggleActive} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SortableItemRow({
  item,
  onToggleActive,
}: {
  item: ItemDTO;
  onToggleActive: (item: ItemDTO) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <Card>
      <CardContent className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground"
          aria-label="並び替え"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex-1">
          <p className="font-medium">{item.itemName}</p>
        </div>
        <Badge variant="secondary">{SCOPE_LABEL[item.scope]}</Badge>
        <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} />
      </CardContent>
      </Card>
    </div>
  );
}
