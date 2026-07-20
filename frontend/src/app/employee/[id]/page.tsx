import EmployeeClient from "./EmployeeClient";

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  return <EmployeeClient id={params.id} />;
}
