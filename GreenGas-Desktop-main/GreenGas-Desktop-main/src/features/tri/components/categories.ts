import { Ban, Cylinder, Leaf, Milk, Package, TreeDeciduous, Wine, type LucideIcon } from 'lucide-react';
import type { Categorie } from '@/api/types';

export const ICONE_CATEGORIE: Record<Categorie, LucideIcon> = {
  organique: Leaf,
  biomasse: TreeDeciduous,
  plastique: Milk,
  metal: Cylinder,
  carton_papier: Package,
  verre: Wine,
  refus: Ban,
};
