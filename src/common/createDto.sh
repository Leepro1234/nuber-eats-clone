transform_param() {
  # 파라미터에서 '-'를 공백으로 대체하고 각 단어의 첫 글자를 대문자로 변환
  # |를 기준으로 왼쪽에서 오른쪽으로 문자가 가공됌
  # sed 스트림편집기 > 아래 구문을 해석해보면 - 를 공백으로 치환한다.
  # awk '{for(i=1;i<=NF;i++)  공백을 기준으로 열을 나눈다 (나는 이대용)이면 나는이 1 이대용이 2 총 2번 포문을 돈다
  # $i=toupper(substr($i,1,1)) 첫글자 대문자
  # tolower(substr($i,2)) 첫글자빼고 소문자
  # END {print ""} 마지막 줄바꿈 넣기
  echo "$2" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) printf "%s", $i=toupper(substr($i,1,1)) tolower(substr($i,2));} END {print ""}'
}
# 스크립트에 전달된 첫 번째 파라미터 변환 후 출력
# 안쓰더라도 파라미터는 전부 전달해야함
transformed_param=$(transform_param "$1", "$2")
folder_path="../$1/dtos"
file_name="${folder_path}/$2.dto.ts"
# 폴더가 존재하지 않으면 폴더를 생성
if [ ! -d "${folder_path}" ]; then
  mkdir -p "${folder_path}"
fi

# 파일이 존재하지 않을 때만 내용을 쓴다
if [ ! -f "${file_name}" ]; then
  echo "import { InputType, ObjectType } from '@nestjs/graphql';" >> "$file_name"
  echo "import { CoreOutput } from 'src/common/dtos/output.dto';" >> "$file_name"
  echo "" >> "$file_name"
  echo "@InputType()" >> "$file_name"
  echo "export class ${transformed_param}Input {}" >> "$file_name"
  echo "@ObjectType()" >> "$file_name"
  echo "export class ${transformed_param}Output extends CoreOutput {}" >> "$file_name"
else
  echo "파일이 이미 존재합니다: ${file_name}"
fi

