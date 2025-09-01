"use client";

// A small helper to display data consistently
const DetailItem = ({ label, value }: { label: string; value: unknown }) => (
  <div className="text-sm">
    <span className="font-semibold">{label}: </span>
    <span>{String(value)}</span>
  </div>
);

export default function ApprovalPayload({
  type,
  payload,
  requestedBy, // 1. It accepts the `requestedBy` prop
}: {
  type: string;
  payload: Record<string, unknown>;
  requestedBy: string; // The prop's type is defined here
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* 2. It displays the name here, so it's no longer unused */}
      <DetailItem label="Requested by" value={requestedBy} />

      <div>
        {(() => {
          switch (type) {
            case "CREATE_PRODUCT":
              return (
                <div className="flex flex-col gap-1">
                  <DetailItem label="Name" value={payload.name} />
                  <DetailItem label="Price" value={payload.price} />
                  <DetailItem label="Category" value={payload.category} />
                </div>
              );
            case "UPDATE_PRODUCT":
            case "UPDATE_PRODUCT_STOCK":
              return (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm">
                    Proposed Changes:
                  </span>
                  <ul className="list-disc pl-5 text-sm">
                    {Object.entries(payload).map(([key, value]) => (
                      <li key={key}>
                        Set <strong>{key}</strong> to &quot;{String(value)}
                        &quot;
                      </li>
                    ))}
                  </ul>
                </div>
              );
            case "REQUEST_RESTOCK":
              return (
                <div className="flex flex-col gap-1">
                  <DetailItem
                    label="Quantity to add"
                    value={payload.quantity}
                  />
                  <DetailItem label="Reason" value={payload.reason} />
                </div>
              );
            case "MARK_AS_PAID":
              return (
                <span className="text-sm italic">
                  Request to mark order as Paid
                </span>
              );
            case "MARK_AS_DELIVERED":
              return (
                <span className="text-sm italic">
                  Request to mark order as Delivered
                </span>
              );
            case "REQUEST_RESTORE":
              return (
                <DetailItem
                  label="Request to restore product"
                  value={payload.productName}
                />
              );
            case "DELETE_ORDER":
              return (
                <span className="text-sm italic text-destructive">
                  Request to Delete Item
                </span>
              );
            case "DELETE_PRODUCT":
              return (
                <span className="text-sm italic text-destructive">
                  Request to Delete Item
                </span>
              );
            default:
              return (
                <pre className="bg-gray-100 p-2 rounded-md text-xs">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              );
          }
        })()}
      </div>
    </div>
  );
}
