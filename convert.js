// 선택된 파일들을 저장할 배열과 변환된 파일들의 Blob 객체를 저장할 객체
let filesArray = [];
let fileBlobs = {};

// 품질 슬라이더와 숫자 입력 필드를 동기화하는 함수
document.getElementById('qualityInput').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('qualityValue').textContent = value;
    document.getElementById('qualityNumberInput').value = value;
});

document.getElementById('qualityNumberInput').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('qualityValue').textContent = value;
    document.getElementById('qualityInput').value = value;
});


// 파일 입력 필드의 변경 이벤트 처리
document.getElementById('fileInput').addEventListener('change', function() {
    filesArray = Array.from(this.files); // 선택된 파일들을 배열로 변환하여 저장
    updateFileList(); // 파일 목록을 업데이트
});

// 파일 목록을 업데이트하는 함수
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    filesArray.forEach(file => {
        const fileItem = createFileItem(file); // 파일 항목을 생성
        fileList.appendChild(fileItem); // 파일 목록에 파일 항목을 추가
    });
}


// 파일 항목을 생성하는 함수
function createFileItem(file) {
    console.log('file',file)
    const fileItem = document.createElement('div');

    const fileName = document.createElement('span');
    fileName.classList.add('file-name');
    fileName.textContent = file.name;

    // 파일 크기 표시
    const fileSizeText = document.createElement('span.file-size');
    fileSizeText.textContent = ` (${createFileSizeText(file.size)})`;

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.classList.add('delete-button');

    fileItem.appendChild(fileName);
    fileItem.appendChild(fileSizeText);
    fileItem.appendChild(deleteButton);

    // 삭제 버튼 클릭 이벤트 처리
    deleteButton.addEventListener('click', function() {
        filesArray = filesArray.filter(f => f !== file); // filesArray에서 해당 파일 제거
        fileItem.remove(); // 해당 파일 항목을 DOM에서 제거
    });


    return fileItem;
}

// downloadAllButton의 클릭 이벤트 핸들러를 함수로 정의
function handleDownloadAllClick() {
    if (Object.keys(fileBlobs).length > 0) {
        const zip = new JSZip();
        Object.keys(fileBlobs).forEach(fileName => {
            zip.file(fileName, fileBlobs[fileName]); // 파일 이름과 Blob 데이터를 zip 파일에 추가
        });

        zip.generateAsync({ type: "blob" }).then(function(content) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "images.zip";
            link.click();
        });
    } else {
        alert('다운로드 할 이미지가 없습니다.');
    }
}

// 변환 버튼 클릭 이벤트 처리
document.getElementById('convertButton').addEventListener('click', function() {
    const qualityInput = document.getElementById('qualityInput').value;
    const downloadLinksDiv = document.getElementById('downloadLinks');
    const progressDiv = document.getElementById('progress');
    const downloadAllButton = document.getElementById('downloadAllButton');

    downloadLinksDiv.innerHTML = '';
    progressDiv.innerHTML = '';
    downloadAllButton.style.display = 'none';

    if (filesArray.length > 0) {
        let completed = 0;
        fileBlobs = {}; // 변환된 파일 블롭 초기화

        filesArray.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();

                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        const downloadLink = document.createElement('a');
                        const downloadItem = document.createElement('div');
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
                        const downloadFileName = `${fileNameWithoutExt}.webp`;

                        // 이미지 미리보기
                        const thumbnailDiv = document.createElement('div');
                        const thumbnail = document.createElement('img');
                        thumbnailDiv.classList.add('thumbnail');
                        thumbnail.src = url;
                        thumbnail.addEventListener('click', function() {
                            document.getElementById('imageModal').style.display = 'block';
                            document.getElementById('previewImage').src = url;
                        });
                        document.querySelector('.close').addEventListener('click', function() {
                            document.getElementById('imageModal').style.display = 'none';
                        });

                        downloadLink.href = url;
                        downloadLink.download = downloadFileName;
                        downloadLink.textContent = `${downloadFileName}`;

                        const originalSize = file.size;
                        const newSize = blob.size;
                        const sizeReduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);
                        const fileSizeRatio = document.createElement('span');
                        const fileSizeText = document.createElement('span');
                        fileSizeRatio.textContent = ` (파일 크기가 ${sizeReduction}% 감소하였습니다!)`;
                        fileSizeText.textContent = ` (${createFileSizeText(blob.size)})`;

                        downloadItem.appendChild(downloadLink);
                        downloadItem.appendChild(fileSizeText); // 파일 크기
                        downloadItem.appendChild(fileSizeRatio); // 감소 비율
                        thumbnailDiv.appendChild(thumbnail);
                        downloadItem.appendChild(thumbnailDiv);
                        downloadLinksDiv.appendChild(downloadItem);

                        // ZIP 파일에 추가
                        fileBlobs[downloadFileName] = blob;

                        // 진행 상태 업데이트
                        completed++;
                        progressDiv.textContent = `변환: ${completed} / ${filesArray.length}`;

                        if (completed === filesArray.length) {
                            downloadAllButton.style.display = 'block';
                        }
                    }, 'image/webp', qualityInput / 100);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // 기존의 click 이벤트 리스너를 제거한 뒤 새로운 리스너를 추가
        downloadAllButton.removeEventListener('click', handleDownloadAllClick); // 기존 핸들러 제거
        downloadAllButton.addEventListener('click', handleDownloadAllClick); // 새로운 핸들러 추가
    } else {
        alert('1개 이상의 파일을 선택해주세요.');
    }
});

function createFileSizeText(fileSize) {
    return fileSize >= 1024 * 1024
        ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
        : (fileSize / 1024).toFixed(2) + ' KB';
}

// 초기화 버튼 클릭 이벤트 처리
document.getElementById('resetButton').addEventListener('click', function() {
    filesArray = [];
    fileBlobs = {};
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('downloadLinks').innerHTML = '';
    document.getElementById('progress').innerHTML = '';
    document.getElementById('downloadAllButton').style.display = 'none';
    document.getElementById('qualityValue').textContent = '95';
    document.getElementById('qualityInput').value = '95';
    document.getElementById('qualityNumberInput').value = '95';
});