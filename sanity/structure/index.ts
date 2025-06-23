import { type StructureBuilder } from 'sanity/structure';
import { PackageIcon, TagIcon, CogIcon, DocumentTextIcon } from '@sanity/icons';

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Products')
        .icon(PackageIcon)
        .child(
          S.documentTypeList('product')
            .title('Products')
            .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
        ),
      S.listItem()
        .title('Categories')
        .icon(TagIcon)
        .child(
          S.documentTypeList('category')
            .title('Categories')
            .defaultOrdering([{ field: 'title', direction: 'asc' }])
        ),
      S.divider(),
      S.listItem()
        .title('Settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('Site Settings')
                .icon(DocumentTextIcon)
                .child(
                  S.document()
                    .schemaType('siteSettings')
                    .documentId('siteSettings')
                ),
            ])
        ),
    ]);
