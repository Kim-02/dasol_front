import React,{ useState, useRef } from "react";
import {PDFDocument} from 'pdf-lib';
import { fetchWithAuth } from "../../utils/auth";

const API_BASE_URL_APPROVAL = 'http://3.34.245.155/api/approval';

function MonthlySummary(){
    const [month, setMonth] = useState('');
    const [monthlyData, setMonthlyData] = useState([]);
    const [summaryHtml, setSummaryHtml] = useState('');
    const [pdfUrl, setPdtUrl] = useState('');
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
    const iframeRef = useRef(null);

    const handleLoad = async () => {
        if(!month){
            alert('먼저 월을 선택하세요.');
            return;
        }

        try {
            // 전체 요청 가져온 뒤, month 기준 필터링
            const resAll = await fetchWithAuth(`${API_BASE_URL_APPROVAL}/getAllRequest`);
            const jsonAll = await resAll.json();
            if (!resAll.ok) throw new Error(jsonAll.message || resAll.statusText);

            const filtered = jsonAll.result.filter(r => r.requestDate.startsWith(month));
            setMonthlyData(filtered);

            if (filtered.length === 0){
                setSummaryHtml(`<li>해당 월에 결재 요청이 없습니다.</li>`);
            } else {
                const items = filtered.map(
                    r => `<li>${r.title} — ${Number(r.requestedAmount).toLocaleString()}원</li>`
                ).join('');
                setSummaryHtml(items);
            }
        } catch (err){
            alert ('데이터 불러오기 실패: ' + err.message);
        }
    };

    const handleGeneratePdf = async () => {
        if(!monthlyData.length) return;

        // 2-1) 템플릿 PDF 불러오기
        const tplBytes = await fetch('/template.pdf').then(r => r.arrayBuffer());
        const pdfDoc = await PDFDocument.load(tplBytes);

        // 2-2) 각 요청마다 한 페이지씩 채우기
        const templatePage = await pdfDoc.copyPages(pdfDoc, [0]);
        const { width, height } = templatePage.getSize();


        for (let i = 0; i < monthlyData.length; i++) {
            const req = monthlyData[i];
            const page = i === 0 ? templatePage : (await pdfDoc.copyPages(pdfDoc, [0]))[0];
            if (i > 0) pdfDoc.addPage(page);

            // 2-3) 이미지 삽입 (영수증 JPG)
            const jpgBytes = Uint8Array.from(atob(req.byteFile), c => c.charCodeAt(0));
            const jpgImage = await pdfDoc.embedJpg(jpgBytes);
            const imgDims  = jpgImage.scale(0.3);

            page.drawImage(jpgImage, {
            x: 50,
            y: height - imgDims.height - 50,
            width: imgDims.width,
            height: imgDims.height
            });

            // 2-4) 텍스트 삽입
            const fontSize = 12;
            page.drawText(`제목: ${req.title}`, { x: 200, y: height - 80, size: fontSize });
            page.drawText(`금액: ${req.requestedAmount.toLocaleString()}원`, { x: 200, y: height - 100, size: fontSize });
            page.drawText(`분류: ${req.approvalCode}`, { x: 200, y: height - 120, size: fontSize });
            // …필요한 다른 필드도 적절한 좌표로 drawText
        }

        // 2-5) PDF 저장 & Blob 생성
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setGeneratedPdfBlob(blob);
        setPdtUrl(url);
    };

    const handleDownload = () => {
        if (!generatedPdfBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(generatedPdfBlob);
        a.download = `결산_${month}.pdf`;
        a.click();
    };

    return (
        <section className="content">
           <h1>월별 결산 추출</h1>

           {/* 1) 월 선택 */}
           <div className="form-group">
           <label htmlFor="monthPicker">월 선택</label>
           <input type="month" id="monthPicker" value={month} onChange={e => setMonth(e.target.value)} />
           <button className="btn-search" onClick={handleLoad}>불러오기</button>
           </div>

           {/* 2) 요약 리스트 (옵션) */}
           <ul id="summaryList" dangerouslySetInnerHTML={{__html: summaryHtml}}></ul>

           {/* 3) 미리보기 & 다운로드 */}
           <div style={{marginTop: '1rem'}}>
            <button className="btn-submit" onClick={handleGeneratePdf} disabled={monthlyData.length === 0}>PDF 미리보기 & 생성</button>
            {pdfUrl && (
                <button className="btn-create" onClick={handleDownload} style={{display: 'none'}} />
            )}
            
           </div>
           {pdfUrl && (
            <iframe ref={iframeRef} title="PDF 미리보기" src={pdfUrl} style = {{width: '100%', height: '80vh', border: '1px solid #ccc', marginTop: '1rem'}}/>
           )}
        </section>
    );
}

export default MonthlySummary;