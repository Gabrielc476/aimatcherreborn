import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 20, 50, 100],
  className = "",
}: PageSizeSelectorProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-sm text-muted-foreground mr-2">Mostrar</span>
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(parseInt(value))}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder={pageSize} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground ml-2">por página</span>
    </div>
  );
}

export default PageSizeSelector;
