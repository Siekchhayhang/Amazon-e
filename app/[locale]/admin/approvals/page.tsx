import { auth } from "@/auth";
import { getPendingRequests } from "@/lib/actions/approval.actions";
import AccessDeniedPage from "../access-denied/page";
import ApprovalActions from "./approval-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ApprovalPayload from "./approval-payload";

type ApprovalRequestType = {
  _id: string;
  type: string;
  requestedBy: {
    name: string;
  };
  createdAt: string;
  payload: Record<string, unknown>;
};

export default async function ApprovalsPage() {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return <AccessDeniedPage />;
  }

  const requests: ApprovalRequestType[] = await getPendingRequests();

  return (
    <div className="space-y-4">
      <h1 className="h1-bold">Pending Approvals</h1>

      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req: ApprovalRequestType) => (
                <TableRow key={req._id}>
                  <TableCell className="capitalize">
                    {req.type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>{req.requestedBy.name}</TableCell>
                  <TableCell>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {/* Pass the requestedBy prop */}
                    <ApprovalPayload
                      type={req.type}
                      payload={req.payload}
                      requestedBy={req.requestedBy.name}
                    />
                  </TableCell>
                  <TableCell>
                    <ApprovalActions requestId={req._id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
