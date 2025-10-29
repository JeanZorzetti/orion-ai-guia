'use client';

import React, { useState } from 'react';
import { useReportBuilder } from '@/hooks/useReportBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Type,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  Space,
  Table,
  Plus,
  Trash2,
  Save,
  FileText,
  Palette,
  Eye,
  Download,
  Layout,
} from 'lucide-react';
import { ReportSection } from '@/types/report';

const sectionTypes = [
  { type: 'texto' as const, icon: Type, label: 'Texto', description: 'Adicionar texto ou título' },
  { type: 'kpi' as const, icon: TrendingUp, label: 'KPI', description: 'Card de métrica' },
  { type: 'tabela' as const, icon: Table, label: 'Tabela', description: 'Tabela de dados' },
  { type: 'grafico' as const, icon: BarChart3, label: 'Gráfico', description: 'Gráfico visual' },
  { type: 'imagem' as const, icon: ImageIcon, label: 'Imagem', description: 'Inserir imagem' },
  { type: 'espacamento' as const, icon: Space, label: 'Espaço', description: 'Espaçamento vertical' },
];

export const ReportBuilder: React.FC = () => {
  const {
    report,
    selectedSection,
    selectedSectionId,
    setSelectedSectionId,
    addSection,
    removeSection,
    updateSection,
    saveReport,
    loadTemplate,
    createNew,
    updateReport,
    templates,
  } = useReportBuilder();

  const [showTemplates, setShowTemplates] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Renderizar seção no canvas
  const renderSection = (section: ReportSection) => {
    const isSelected = selectedSectionId === section.id;

    return (
      <div
        key={section.id}
        className={`relative border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedSectionId(section.id)}
      >
        {/* Indicador de tipo */}
        <div className="absolute top-2 right-2 flex gap-2">
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            {section.tipo}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              removeSection(section.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Conteúdo da seção */}
        <div className="pr-20">
          {section.tipo === 'texto' && (
            <div>
              <p className="text-sm text-gray-600">Texto</p>
              <p className="mt-2">{(section.config as any).conteudo}</p>
            </div>
          )}

          {section.tipo === 'kpi' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{(section.config as any).metrica}</p>
                <p className="text-2xl font-bold">{(section.config as any).valorFormatado}</p>
              </div>
            </div>
          )}

          {section.tipo === 'tabela' && (
            <div className="border rounded p-3 bg-gray-50">
              <Table className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-center text-sm text-gray-500 mt-2">Tabela de dados</p>
            </div>
          )}

          {section.tipo === 'grafico' && (
            <div className="border rounded p-3 bg-gray-50">
              <BarChart3 className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-center text-sm text-gray-500 mt-2">Gráfico</p>
            </div>
          )}

          {section.tipo === 'imagem' && (
            <div className="border rounded p-3 bg-gray-50">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-center text-sm text-gray-500 mt-2">Imagem</p>
            </div>
          )}

          {section.tipo === 'espacamento' && (
            <div className="border-t-2 border-dashed border-gray-300 my-2">
              <p className="text-center text-xs text-gray-400 mt-1">
                Espaçamento: {(section.config as any).altura}px
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar painel de propriedades
  const renderPropertiesPanel = () => {
    if (!selectedSection) {
      return (
        <div className="text-center text-gray-500 py-8">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Selecione uma seção para editar</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <Label>Tipo de Seção</Label>
          <p className="text-sm font-medium capitalize">{selectedSection.tipo}</p>
        </div>

        <div>
          <Label>Largura</Label>
          <Select
            value={selectedSection.layout.largura}
            onValueChange={(value) =>
              updateSection(selectedSection.id, {
                layout: { ...selectedSection.layout, largura: value as any },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completa">Completa</SelectItem>
              <SelectItem value="metade">Metade</SelectItem>
              <SelectItem value="terco">1/3</SelectItem>
              <SelectItem value="dois-tercos">2/3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedSection.tipo === 'texto' && (
          <>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={(selectedSection.config as any).conteudo}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    config: { ...selectedSection.config, conteudo: e.target.value },
                  })
                }
                rows={4}
              />
            </div>

            <div>
              <Label>Tamanho da Fonte</Label>
              <Input
                type="number"
                value={(selectedSection.config as any).estilo.fontSize}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    config: {
                      ...selectedSection.config,
                      estilo: {
                        ...(selectedSection.config as any).estilo,
                        fontSize: parseInt(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
          </>
        )}

        {selectedSection.tipo === 'kpi' && (
          <>
            <div>
              <Label>Métrica</Label>
              <Input
                value={(selectedSection.config as any).metrica}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    config: { ...selectedSection.config, metrica: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label>Valor Formatado</Label>
              <Input
                value={(selectedSection.config as any).valorFormatado}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    config: { ...selectedSection.config, valorFormatado: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label>Cor</Label>
              <Input
                type="color"
                value={(selectedSection.config as any).cor}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    config: { ...selectedSection.config, cor: e.target.value },
                  })
                }
              />
            </div>
          </>
        )}

        {selectedSection.tipo === 'espacamento' && (
          <div>
            <Label>Altura (px)</Label>
            <Input
              type="number"
              value={(selectedSection.config as any).altura}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  config: { ...selectedSection.config, altura: parseInt(e.target.value) },
                })
              }
            />
          </div>
        )}
      </div>
    );
  };

  if (showTemplates && report.layout.secoes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Report Builder</h2>
            <p className="text-gray-600">Crie relatórios personalizados com nosso editor visual</p>
          </div>
          <Button onClick={() => setShowTemplates(false)}>
            <Plus className="h-4 w-4 mr-2" />
            Começar do Zero
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Layout className="h-8 w-8 text-blue-600" />
                  {template.popular && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      Popular
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{template.nome}</CardTitle>
                <CardDescription>{template.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    loadTemplate(template.id);
                    setShowTemplates(false);
                  }}
                >
                  Usar Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={report.nome}
            onChange={(e) => updateReport({ nome: e.target.value })}
            className="text-lg font-semibold w-64"
          />
          <Button variant="ghost" size="sm" onClick={createNew}>
            Novo
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Editor' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={saveReport}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Componentes */}
        <div className="w-64 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Componentes</h3>
          <div className="space-y-2">
            {sectionTypes.map(({ type, icon: Icon, label, description }) => (
              <Button
                key={type}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addSection(type)}
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 min-h-[1000px]">
            {report.layout.secoes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Comece adicionando componentes</p>
                <p className="text-sm">Selecione um componente na barra lateral</p>
              </div>
            ) : (
              report.layout.secoes.map(renderSection)
            )}
          </div>
        </div>

        {/* Sidebar - Propriedades */}
        <div className="w-80 border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Propriedades
          </h3>
          {renderPropertiesPanel()}
        </div>
      </div>
    </div>
  );
};
