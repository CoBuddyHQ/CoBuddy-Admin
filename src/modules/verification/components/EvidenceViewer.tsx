/* eslint-disable @next/next/no-img-element */
interface Props {
  idUrl: string;
  selfieUrl: string;
  faceScore: number;
  liveness: boolean;
  docValid: boolean;
}

export function EvidenceViewer({ idUrl, selfieUrl, faceScore, liveness, docValid }: Props) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Evidence</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">ID Document</p>
          <div className="aspect-[4/3] bg-muted rounded-md overflow-hidden border relative">
            <img src={idUrl} alt="ID Document" className="object-cover w-full h-full" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Selfie</p>
          <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden border relative">
            <img src={selfieUrl} alt="Selfie" className="object-cover w-full h-full" />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-3 rounded-md border space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Face Match Score:</span>
          <span className={`font-medium ${faceScore >= 90 ? 'text-green-600' : faceScore < 30 ? 'text-red-600' : 'text-orange-500'}`}>
            {faceScore}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Liveness Check:</span>
          <span className={`font-medium ${liveness ? 'text-green-600' : 'text-red-600'}`}>
            {liveness ? 'Passed' : 'Failed'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Document Validity:</span>
          <span className={`font-medium ${docValid ? 'text-green-600' : 'text-red-600'}`}>
            {docValid ? 'Valid' : 'Invalid'}
          </span>
        </div>
      </div>
    </div>
  );
}
