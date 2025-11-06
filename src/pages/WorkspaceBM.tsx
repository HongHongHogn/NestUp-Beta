import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import NavigationBar from "@/components/NavigationBar";
import { 
  Save, 
  ArrowLeft, 
  Edit2, 
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  Users,
  Activity,
  Box,
  Gift,
  Heart,
  Truck,
  Target,
  DollarSign,
  TrendingUp
} from "lucide-react";

interface BMBlock {
  description: string;
  items: string[];
}

interface BMCanvas {
  id: string;
  projectId: string;
  title: string;
  keyPartners: BMBlock;
  keyActivities: BMBlock;
  keyResources: BMBlock;
  valuePropositions: BMBlock;
  customerRelationships: BMBlock;
  channels: BMBlock;
  customerSegments: BMBlock;
  costStructure: BMBlock;
  revenueStreams: BMBlock;
}

const BM_BLOCKS = [
  { key: 'keyPartners', label: '주요 파트너', color: 'bg-blue-50 border-blue-200' },
  { key: 'keyActivities', label: '주요 활동', color: 'bg-purple-50 border-purple-200' },
  { key: 'keyResources', label: '핵심 자원', color: 'bg-pink-50 border-pink-200' },
  { key: 'valuePropositions', label: '가치 제안', color: 'bg-green-50 border-green-200', center: true },
  { key: 'customerRelationships', label: '고객 관계', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'channels', label: '채널', color: 'bg-orange-50 border-orange-200' },
  { key: 'customerSegments', label: '고객 세그먼트', color: 'bg-red-50 border-red-200' },
  { key: 'costStructure', label: '비용 구조', color: 'bg-gray-50 border-gray-200' },
  { key: 'revenueStreams', label: '수익원', color: 'bg-emerald-50 border-emerald-200' },
] as const;

const WorkspaceBM = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bmCanvas, setBmCanvas] = useState<BMCanvas | null>(null);
  const [editData, setEditData] = useState<{ description?: string; item?: string }>({});

  useEffect(() => {
    fetchBMCanvas();
  }, [projectId]);

  const fetchBMCanvas = async () => {
    try {
      if (!projectId) return;
      const data = await apiFetch<{ success: boolean; bmCanvas: BMCanvas }>(
        `/api/workspace/${projectId}/bm`
      );
      if (!data.success) throw new Error("BM 캔버스 조회에 실패했습니다.");
      setBmCanvas(data.bmCanvas);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류",
        description: err.message || "BM 캔버스를 불러올 수 없습니다.",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bmCanvas || !projectId) return;
    
    setSaving(true);
    try {
      const data = await apiFetch<{ success: boolean; bmCanvas: BMCanvas }>(
        `/api/workspace/${projectId}/bm`,
        {
          method: "PUT",
          body: JSON.stringify(bmCanvas),
        }
      );
      
      if (!data.success) throw new Error("저장에 실패했습니다.");
      
      toast({
        title: "저장 완료",
        description: "BM 캔버스가 저장되었습니다.",
      });
      setBmCanvas(data.bmCanvas);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류",
        description: err.message || "저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlock = (blockKey: string, index?: number) => {
    if (!bmCanvas) return;
    
    const block = bmCanvas[blockKey as keyof BMCanvas] as BMBlock;
    if (index !== undefined) {
      setEditData({ item: block.items[index] || "" });
      setEditingIndex(index);
    } else {
      setEditData({ description: block.description || "" });
      setEditingIndex(null);
    }
    setEditing(blockKey);
  };

  const handleSaveEdit = (blockKey: string) => {
    if (!bmCanvas || !editing) return;
    
    const block = bmCanvas[editing as keyof BMCanvas] as BMBlock;
    const updated = { ...bmCanvas };
    const updatedBlock: BMBlock = { ...block };
    
    if (editingIndex !== null) {
      // 아이템 수정
      const newItems = [...block.items];
      if (editingIndex >= newItems.length) {
        newItems.push(editData.item || "");
      } else {
        newItems[editingIndex] = editData.item || "";
      }
      updatedBlock.items = newItems;
    } else {
      // 설명 수정
      updatedBlock.description = editData.description || "";
    }
    
    (updated as any)[editing] = updatedBlock;
    setBmCanvas(updated);
    setEditing(null);
    setEditingIndex(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditingIndex(null);
    setEditData({});
  };

  const handleDeleteItem = (blockKey: string, index: number) => {
    if (!bmCanvas) return;
    
    const block = bmCanvas[blockKey as keyof BMCanvas] as BMBlock;
    const updated = { ...bmCanvas };
    const updatedBlock: BMBlock = {
      ...block,
      items: block.items.filter((_, i) => i !== index),
    };
    (updated as any)[blockKey] = updatedBlock;
    setBmCanvas(updated);
  };

  const handleAddItem = (blockKey: string) => {
    if (!bmCanvas) return;
    handleEditBlock(blockKey, -1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <div className="container mx-auto p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!bmCanvas) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>BM 캔버스를 찾을 수 없습니다</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")}>대시보드로 돌아가기</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container mx-auto p-3 max-w-[98vw] bg-background">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{bmCanvas.title}</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                저장
              </>
            )}
          </Button>
        </div>

        {/* BM 캔버스 그리드 - 표준 5열 x 3행 레이아웃 */}
        <div className="grid grid-cols-5 gap-2 auto-rows-fr h-[calc(100vh-180px)] max-h-[calc(100vh-180px)]">
          {/* 행 1: 상단 */}
          {/* Key Partners */}
          <BMBlockCard
            blockKey="keyPartners"
            label="주요 파트너"
            block={bmCanvas.keyPartners}
            color="bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800"
            iconColor="text-blue-600 dark:text-blue-400"
            editing={editing === "keyPartners"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("keyPartners", index)}
            onSave={() => handleSaveEdit("keyPartners")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("keyPartners", index)}
            onAdd={() => handleAddItem("keyPartners")}
            onEditDataChange={(data) => setEditData(data)}
          />
          
          {/* Key Activities */}
          <BMBlockCard
            blockKey="keyActivities"
            label="주요 활동"
            block={bmCanvas.keyActivities}
            color="bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800"
            iconColor="text-purple-600 dark:text-purple-400"
            editing={editing === "keyActivities"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("keyActivities", index)}
            onSave={() => handleSaveEdit("keyActivities")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("keyActivities", index)}
            onAdd={() => handleAddItem("keyActivities")}
            onEditDataChange={(data) => setEditData(data)}
          />
          
          {/* Value Proposition - 2열 x 2행 */}
          <BMBlockCard
            blockKey="valuePropositions"
            label="가치 제안"
            block={bmCanvas.valuePropositions}
            color="bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-800"
            iconColor="text-green-600 dark:text-green-400"
            editing={editing === "valuePropositions"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("valuePropositions", index)}
            onSave={() => handleSaveEdit("valuePropositions")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("valuePropositions", index)}
            onAdd={() => handleAddItem("valuePropositions")}
            onEditDataChange={(data) => setEditData(data)}
            center
            rowSpan={2}
            colSpan={2}
          />
          
          {/* Customer Relationships */}
          <BMBlockCard
            blockKey="customerRelationships"
            label="고객 관계"
            block={bmCanvas.customerRelationships}
            color="bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
            iconColor="text-yellow-600 dark:text-yellow-400"
            editing={editing === "customerRelationships"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("customerRelationships", index)}
            onSave={() => handleSaveEdit("customerRelationships")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("customerRelationships", index)}
            onAdd={() => handleAddItem("customerRelationships")}
            onEditDataChange={(data) => setEditData(data)}
          />
          
          {/* Customer Segments - 2행 */}
          <BMBlockCard
            blockKey="customerSegments"
            label="고객 세그먼트"
            block={bmCanvas.customerSegments}
            color="bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
            iconColor="text-red-600 dark:text-red-400"
            editing={editing === "customerSegments"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("customerSegments", index)}
            onSave={() => handleSaveEdit("customerSegments")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("customerSegments", index)}
            onAdd={() => handleAddItem("customerSegments")}
            onEditDataChange={(data) => setEditData(data)}
            rowSpan={2}
          />

          {/* 행 2: 중간 */}
          {/* Key Resources */}
          <BMBlockCard
            blockKey="keyResources"
            label="핵심 자원"
            block={bmCanvas.keyResources}
            color="bg-pink-50/50 dark:bg-pink-950/20 border-pink-300 dark:border-pink-800"
            iconColor="text-pink-600 dark:text-pink-400"
            editing={editing === "keyResources"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("keyResources", index)}
            onSave={() => handleSaveEdit("keyResources")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("keyResources", index)}
            onAdd={() => handleAddItem("keyResources")}
            onEditDataChange={(data) => setEditData(data)}
          />
          
          {/* 빈 공간 (Value Proposition이 차지) */}
          <div className="col-span-1"></div>
          
          {/* Value Proposition은 이미 위에서 정의됨 (rowSpan=2) */}
          
          {/* Channels */}
          <BMBlockCard
            blockKey="channels"
            label="채널"
            block={bmCanvas.channels}
            color="bg-orange-50/50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800"
            iconColor="text-orange-600 dark:text-orange-400"
            editing={editing === "channels"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("channels", index)}
            onSave={() => handleSaveEdit("channels")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("channels", index)}
            onAdd={() => handleAddItem("channels")}
            onEditDataChange={(data) => setEditData(data)}
          />
          
          {/* Customer Segments는 이미 위에서 정의됨 (rowSpan=2) */}

          {/* 행 3: 하단 */}
          {/* Cost Structure - 3열 */}
          <BMBlockCard
            blockKey="costStructure"
            label="비용 구조"
            block={bmCanvas.costStructure}
            color="bg-gray-50/50 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700"
            iconColor="text-gray-700 dark:text-gray-300"
            editing={editing === "costStructure"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("costStructure", index)}
            onSave={() => handleSaveEdit("costStructure")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("costStructure", index)}
            onAdd={() => handleAddItem("costStructure")}
            onEditDataChange={(data) => setEditData(data)}
            colSpan={3}
          />
          
          {/* Revenue Streams - 2열 */}
          <BMBlockCard
            blockKey="revenueStreams"
            label="수익원"
            block={bmCanvas.revenueStreams}
            color="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
            iconColor="text-emerald-600 dark:text-emerald-400"
            editing={editing === "revenueStreams"}
            editingIndex={editingIndex}
            editData={editData}
            onEdit={(index) => handleEditBlock("revenueStreams", index)}
            onSave={() => handleSaveEdit("revenueStreams")}
            onCancel={handleCancelEdit}
            onDelete={(index) => handleDeleteItem("revenueStreams", index)}
            onAdd={() => handleAddItem("revenueStreams")}
            onEditDataChange={(data) => setEditData(data)}
            colSpan={2}
          />
        </div>
      </div>
    </div>
  );
};

interface BMBlockCardProps {
  blockKey: string;
  label: string;
  block: BMBlock;
  color: string;
  iconColor?: string;
  editing: boolean;
  editingIndex: number | null;
  editData: { description?: string; item?: string };
  onEdit: (index?: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onEditDataChange: (data: { description?: string; item?: string }) => void;
  center?: boolean;
  rowSpan?: number;
  colSpan?: number;
}

// 블록별 아이콘 매핑
const getBlockIcon = (blockKey: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    keyPartners: Users,
    keyActivities: Activity,
    keyResources: Box,
    valuePropositions: Gift,
    customerRelationships: Heart,
    channels: Truck,
    customerSegments: Target,
    costStructure: DollarSign,
    revenueStreams: TrendingUp,
  };
  return iconMap[blockKey] || Box;
};

const BMBlockCard = ({
  blockKey,
  label,
  block,
  color,
  iconColor = "text-foreground",
  editing,
  editingIndex,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAdd,
  onEditDataChange,
  center = false,
  rowSpan,
  colSpan,
}: BMBlockCardProps) => {
  const gridStyle: React.CSSProperties = {};
  if (rowSpan) gridStyle.gridRow = `span ${rowSpan}`;
  if (colSpan) gridStyle.gridColumn = `span ${colSpan}`;
  
  const Icon = getBlockIcon(blockKey);
  
  // 블록 크기에 따른 스타일 조정
  const isLargeBlock = center || rowSpan === 2 || colSpan === 3 || colSpan === 2;
  
  return (
    <Card 
      className={`border-2 ${color} h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow bg-background/90 backdrop-blur-sm overflow-hidden`}
      style={gridStyle}
    >
      <CardHeader className="pb-2 border-b px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`${isLargeBlock ? 'h-4 w-4' : 'h-3.5 w-3.5'} ${iconColor}`} />
            <CardTitle className={`${isLargeBlock ? 'text-sm' : 'text-xs'} font-bold text-foreground`}>
              {label}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`${isLargeBlock ? 'h-6 w-6' : 'h-5 w-5'} hover:bg-accent`}
              onClick={() => onEdit()}
              disabled={editing}
            >
              <Edit2 className={`${isLargeBlock ? 'h-3.5 w-3.5' : 'h-3 w-3'}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3 px-3 pb-3 flex-1 overflow-y-auto">
        {/* 설명 */}
        {editing && editingIndex === null ? (
          <div className="space-y-2">
            <Textarea
              value={editData.description || block.description || ""}
              onChange={(e) => onEditDataChange({ description: e.target.value })}
              placeholder="설명을 입력하세요"
              className={`${isLargeBlock ? 'min-h-[50px] text-sm' : 'min-h-[40px] text-xs'}`}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSave}>
                <Check className="h-3 w-3 mr-1" />
                저장
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="h-3 w-3 mr-1" />
                취소
              </Button>
            </div>
          </div>
        ) : (
          <p className={`${isLargeBlock ? 'text-sm' : 'text-xs'} text-foreground/90 leading-relaxed line-clamp-3`}>
            {block.description || <span className="text-muted-foreground italic">설명을 추가하세요</span>}
          </p>
        )}

        <Separator className="my-2" />

        {/* 아이템 목록 */}
        <div className={`space-y-1.5 flex-1 ${isLargeBlock ? 'space-y-2' : 'space-y-1.5'}`}>
          {block.items.map((item, index) => (
            <div key={index} className="flex items-start gap-1.5 group">
              <Badge 
                variant="secondary" 
                className={`flex-1 ${isLargeBlock ? 'text-sm py-1.5 px-2.5' : 'text-xs py-1 px-2'} text-left font-normal bg-secondary/50 hover:bg-secondary/80 transition-colors leading-snug`}
              >
                {editing && editingIndex === index ? (
                  <div className="flex-1 space-y-1.5 w-full">
                    <Textarea
                      value={editData.item || item}
                      onChange={(e) => onEditDataChange({ item: e.target.value })}
                      placeholder="항목을 입력하세요"
                      className={`${isLargeBlock ? 'min-h-[45px] text-sm' : 'min-h-[40px] text-xs'}`}
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" className={`${isLargeBlock ? 'h-6' : 'h-5'} text-xs`} onClick={onSave}>
                        <Check className="h-3 w-3 mr-1" />
                        저장
                      </Button>
                      <Button size="sm" variant="outline" className={`${isLargeBlock ? 'h-6' : 'h-5'} text-xs`} onClick={onCancel}>
                        <X className="h-3 w-3 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span className={`text-foreground ${isLargeBlock ? 'text-sm' : 'text-xs'} leading-snug`}>{item}</span>
                )}
              </Badge>
              {!editing && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLargeBlock ? 'h-6 w-6' : 'h-5 w-5'} hover:bg-accent`}
                    onClick={() => onEdit(index)}
                  >
                    <Edit2 className={`${isLargeBlock ? 'h-3.5 w-3.5' : 'h-3 w-3'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLargeBlock ? 'h-6 w-6' : 'h-5 w-5'} hover:bg-destructive/10 hover:text-destructive`}
                    onClick={() => onDelete(index)}
                  >
                    <Trash2 className={`${isLargeBlock ? 'h-3.5 w-3.5' : 'h-3 w-3'}`} />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {editing && editingIndex === -1 ? (
            <div className="space-y-1.5">
              <Textarea
                value={editData.item || ""}
                onChange={(e) => onEditDataChange({ item: e.target.value })}
                placeholder="새 항목을 입력하세요"
                className={`${isLargeBlock ? 'min-h-[45px] text-sm' : 'min-h-[40px] text-xs'}`}
              />
              <div className="flex gap-1.5">
                <Button size="sm" className={`${isLargeBlock ? 'h-6' : 'h-5'} text-xs`} onClick={onSave}>
                  <Check className="h-3 w-3 mr-1" />
                  추가
                </Button>
                <Button size="sm" variant="outline" className={`${isLargeBlock ? 'h-6' : 'h-5'} text-xs`} onClick={onCancel}>
                  <X className="h-3 w-3 mr-1" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            !editing && (
              <Button
                variant="outline"
                size="sm"
                className={`w-full ${isLargeBlock ? 'text-sm py-2' : 'text-xs py-1.5'} hover:bg-accent`}
                onClick={onAdd}
              >
                <Plus className={`${isLargeBlock ? 'h-3.5 w-3.5 mr-1.5' : 'h-3 w-3 mr-1'}`} />
                항목 추가
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceBM;

