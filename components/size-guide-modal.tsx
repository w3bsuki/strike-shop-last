"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReactNode } from "react"

const topsData = [
  { size: "XS", chest: "34-36", waist: "28-30" },
  { size: "S", chest: "36-38", waist: "30-32" },
  { size: "M", chest: "38-40", waist: "32-34" },
  { size: "L", chest: "40-42", waist: "34-36" },
  { size: "XL", chest: "42-44", waist: "36-38" },
  { size: "XXL", chest: "44-46", waist: "38-40" },
]

const bottomsData = [
  { size: "XS", waist: "28-30", hips: "34-36" },
  { size: "S", waist: "30-32", hips: "36-38" },
  { size: "M", waist: "32-34", hips: "38-40" },
  { size: "L", waist: "34-36", hips: "40-42" },
  { size: "XL", waist: "36-38", hips: "42-44" },
  { size: "XXL", waist: "38-40", hips: "44-46" },
]

interface SizeGuideModalProps {
  children?: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export function SizeGuideModal({ children, isOpen, onClose }: SizeGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-['Typewriter']">Size Guide</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="tops" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tops">Tops / Outerwear</TabsTrigger>
            <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
          </TabsList>
          <TabsContent value="tops">
            <p className="text-sm text-muted-foreground mb-4">Measurements are in inches.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Size</TableHead>
                  <TableHead>Chest</TableHead>
                  <TableHead>Waist</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topsData.map((row) => (
                  <TableRow key={row.size}>
                    <TableCell className="font-medium">{row.size}</TableCell>
                    <TableCell>{row.chest}"</TableCell>
                    <TableCell>{row.waist}"</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="bottoms">
            <p className="text-sm text-muted-foreground mb-4">Measurements are in inches.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Size</TableHead>
                  <TableHead>Waist</TableHead>
                  <TableHead>Hips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottomsData.map((row) => (
                  <TableRow key={row.size}>
                    <TableCell className="font-medium">{row.size}</TableCell>
                    <TableCell>{row.waist}"</TableCell>
                    <TableCell>{row.hips}"</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
