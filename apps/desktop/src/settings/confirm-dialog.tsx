import { Button } from "@erda/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@erda/ui/components/ui/dialog";
import type { ReactNode } from "react";

import { useAction } from "#/lib/action.ts";

export function ConfirmDialog({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  description,
  confirmLabel,
  failTitle,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  failTitle: string;
  onConfirm: () => Promise<unknown>;
}) {
  const { run, pending } = useAction();
  const confirm = async () => {
    const ok = await run(async () => {
      await onConfirm();
      return true;
    }, failTitle);
    if (ok) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <DialogContent role="alertdialog" showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
