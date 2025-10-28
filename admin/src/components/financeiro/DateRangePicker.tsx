'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS = [
  {
    label: 'Últimos 7 dias',
    getValue: () => ({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => ({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Últimos 90 dias',
    getValue: () => ({
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Mês atual',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Mês anterior',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'Ano atual',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const newRange = preset.getValue();
    onChange(newRange);
    setTempRange(newRange);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(
      range.to,
      'dd/MM/yyyy',
      { locale: ptBR }
    )}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateRange(value) : 'Selecione o período'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Períodos Rápidos
            </p>
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Data Inicial
                </p>
                <Calendar
                  mode="single"
                  selected={tempRange.from}
                  onSelect={(date) =>
                    date && setTempRange({ ...tempRange, from: date })
                  }
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Data Final
                </p>
                <Calendar
                  mode="single"
                  selected={tempRange.to}
                  onSelect={(date) =>
                    date && setTempRange({ ...tempRange, to: date })
                  }
                  locale={ptBR}
                  disabled={(date) => date < tempRange.from}
                  className="rounded-md border"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
