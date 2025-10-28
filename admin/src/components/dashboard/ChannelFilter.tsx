'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ShoppingBag, Package, ShoppingCart, Store, Video, Edit } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface Channel {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CHANNELS: Channel[] = [
  {
    value: 'shopify',
    label: 'Shopify',
    icon: <ShoppingBag className="h-4 w-4" />,
    color: '#7C3AED'
  },
  {
    value: 'mercadolivre',
    label: 'Mercado Livre',
    icon: <Package className="h-4 w-4" />,
    color: '#FBBF24'
  },
  {
    value: 'woocommerce',
    label: 'WooCommerce',
    icon: <ShoppingCart className="h-4 w-4" />,
    color: '#9333EA'
  },
  {
    value: 'magalu',
    label: 'Magalu',
    icon: <Store className="h-4 w-4" />,
    color: '#3B82F6'
  },
  {
    value: 'tiktok',
    label: 'TikTok Shop',
    icon: <Video className="h-4 w-4" />,
    color: '#EC4899'
  },
  {
    value: 'manual',
    label: 'Manual',
    icon: <Edit className="h-4 w-4" />,
    color: '#10B981'
  }
];

interface ChannelFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export const ChannelFilter: React.FC<ChannelFilterProps> = ({
  selected,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChannel = (channelValue: string) => {
    if (selected.includes(channelValue)) {
      onChange(selected.filter(v => v !== channelValue));
    } else {
      onChange([...selected, channelValue]);
    }
  };

  const selectAll = () => {
    onChange(CHANNELS.map(c => c.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getSelectedLabels = () => {
    if (selected.length === 0) {
      return 'Todos os canais';
    }
    if (selected.length === CHANNELS.length) {
      return 'Todos os canais';
    }
    if (selected.length === 1) {
      return CHANNELS.find(c => c.value === selected[0])?.label || '';
    }
    return `${selected.length} canais`;
  };

  return (
    <div className={cn('', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              {getSelectedLabels()}
            </span>
            <div className="flex items-center gap-2">
              {selected.length > 0 && selected.length < CHANNELS.length && (
                <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                  {selected.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar canal..." />
            <CommandList>
              <CommandEmpty>Nenhum canal encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={selectAll}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.length === CHANNELS.length
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Selecionar todos</span>
                </CommandItem>

                <CommandItem
                  onSelect={clearAll}
                  className="cursor-pointer"
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-muted-foreground opacity-50" />
                  <span className="font-medium">Limpar seleção</span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Canais">
                {CHANNELS.map((channel) => {
                  const isSelected = selected.includes(channel.value);
                  return (
                    <CommandItem
                      key={channel.value}
                      value={channel.value}
                      onSelect={() => toggleChannel(channel.value)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div style={{ color: channel.color }}>
                          {channel.icon}
                        </div>
                        <span>{channel.label}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChannelFilter;
