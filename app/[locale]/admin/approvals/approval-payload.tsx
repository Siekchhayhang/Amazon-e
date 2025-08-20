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
}: {
  type: string;
  payload: Record<string, unknown>;
  requestedBy: string;
}) {
  switch (type) {
    case "CREATE_PRODUCT":
      return (
        <div className="flex flex-col gap-1">
          <DetailItem label="Name" value={payload.name} />
          <DetailItem label="Price" value={payload.price} />
          <DetailItem label="Category" value={payload.category} />
        </div>
      );

    case "UPDATE_PRODUCT": // 2. Separate case for general product updates
      return (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Proposed Changes:</span>
          <ul className="list-disc pl-5 text-sm">
            {Object.entries(payload).map(([key, value]) => (
              <li key={key}>
                Set <strong>{key}</strong> to &quot;{String(value)}&quot;
              </li>
            ))}
          </ul>
        </div>
      );

    case "UPDATE_PRODUCT_STOCK": // 3. Specific case for just updating stock
      return (
        <DetailItem label="Set stock count to" value={payload.countInStock} />
      );

    case "MARK_AS_PAID":
      return (
        <span className="text-sm italic">Request to mark order as Paid</span>
      );

    case "MARK_AS_DELIVERED":
      return (
        <span className="text-sm italic">
          Request to mark order as Delivered
        </span>
      );

    case "DELETE_ORDER":
      return (
        <span className="text-sm italic text-destructive">
          Request to Delete Order
        </span>
      );

    // Fallback for any other types
    default:
      return (
        <pre className="bg-gray-100 p-2 rounded-md text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      );
  }
}
