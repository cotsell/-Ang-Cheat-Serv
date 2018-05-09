import * as mongoose from 'mongoose';
import { Document, Schema, Model } from 'mongoose';
import { Util } from './Mongo';
import { Result } from '../interface';

export default class Scrap {
  private schema: Schema;
  private model: Model<Document>;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model<Document>('scrap', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        userId: { type: String },
        // docuList: { type: [String] },
        labelList: { type: [String] },
        docuList: { type: [
            {
              docuId: { type: String },
              docuTitle: { type: String },
              label: { type: String, required: true },
              createdTime: { type: Date, default: Date.now }
            }
          ] 
        },
        createdTime: { type: Date, default: Date.now },
        updatedTime: { type: Date, default: Date.now }
      }
    );

    return schema;
  }

  public getSchema(): Schema {
    return this.schema;
  }

  public getModel(): Model<Document> {
    return this.model;
  }

    // 새로운 스크랩 추가.
    // label = 
    // {    isNew: false,
    //      documentId: '5ad4cd750ea7de3044c500e4',
    //      documentTitle: '테스트 문서에요',
    //      label: 'default' 
    // }
    public async setScrap(userId: string, label: any) {

        // ---- 정리용도 함수 모음 -----------------------------------
        const saveNewScrapGroup = async () => {
            const doc = new this.model(
                {
                    userId: userId,
                    labelList: [label.label],
                    docuList: [
                        {
                            docuId: label.documentId,
                            docuTitle: label.documentTitle,
                            label: label.label
                        }
                    ],
                }
            );

            const saveResult:any = await doc.save()
                .catch(err => { console.error(err); return null; });

            if (saveResult === null)
                return new Result(false, '유저 스크랩을 만들면서 문제가 발생했어요.');
            
            return new Result(true, '스크랩 저장 성공이에요.', 0, true);
        }
        // ---- 정리용도 함수 모음 끝 -------------------------------

        let labelList: string[] = [], docuList: any[] = [];
        const result: any = await this.model.findOne({ userId: userId })
            .catch(err => { console.error(err); return -1; });

        if (result === -1)
            return new Result(false, '유저 스크랩을 찾으면서 문제가 발생했어요.');

        if (result === null) {
            // 새로 생성..
            return await saveNewScrapGroup();
        } else {
            // 기존 유저 스크랩 정보가 있는거니까..
            if (label.isNew === true) {
                // 새로운 labelList 추가.
                
                // labelList가 비어있지 않다면 중복 검사 시도.
                if (result.labelList !== undefined && result.labelList.length > 0) {

                    // labelList에 중복되는 label이 있는지 검사.
                    if (result.labelList.find((finding: string) => {
                        return finding === label.label ? true : false;
                    }) !== undefined) {
                        return new Result(false, '이미 있는 라벨이에요..');
                    } 
    
                    // new모드인데 왜 docuList를 중복검사 하지? 필요가 없는거 같은데?
                    // TODO 필요 없는 듯 한데... 흠..
                    // if (result.docuList.find((finding: any) => {
                    //     return finding.docuId === label.documentId &&
                    //             finding.label === label.label ?
                    //             true : false;                        
                    // }) !== undefined) {
                    //     return new Result(false, '이미 한 스크랩이에요.');
                    // }

                    labelList = [...result.labelList];
                    docuList = [...result.docuList];
                } 

                // labelList와 docuList가 비어있었다면 바로 여기로 왔을꺼고..
                // 비어있지 않았다면, 위에서 기존 자료들과 합쳐놓고 여기로 왔을꺼고..
                // 어쨌든 아래 코드는 중복되는 코드
                labelList.push(label.label);
                docuList.push({
                    docuId: label.documentId,
                    docuTitle: label.documentTitle,
                    label: label.label
                });

            } else {
                // 기존 입력된 labelList label로 입력.

                // labelList가 비어있다면, 취소시켜야지.. 
                if (result.labelList === undefined || result.labelList.length < 1)
                    return new Result(false, '만들어진 라벨이 하나도 없어요..');

                // labelList가 비어있지 않다면, 중복 검사.
                // 여기서는 중복되어야 정상인거임.
                if (result.labelList.find((finding: string) => {
                    return finding === label.label ? true : false;
                }) === undefined) 
                    return new Result(false, '해당 라벨이 존재하지 않아요.');

                // docuList가 비어있지 않으면 중복 검사.
                // label은 존재하는데, docuList는 비었을 수도 있지, 사용자가 삭제를 
                // 했을 수도 있으니까..
                if (result.docuList !== undefined && result.docuList.length > 0) {
                    if (result.docuList.find((finding: any) => {
                        return finding.docuId === label.documentId &&
                                finding.label === label.label ?
                                true : false;
                    }) !== undefined) 
                        return new Result(false, '이미 한 스크랩이에요.');
                    
                    // 중복된게 없다면..
                    labelList = [...result.labelList];
                    docuList = [...result.docuList];
                }

                // docuList가 비었다면..
                docuList.push(
                    {
                        docuId: label.documentId,
                        docuTitle: label.documentTitle,
                        label: label.label
                    }
                );
            }

            // 여기서 딱 모아서 저장.
            const finalResult = await this.model.updateOne(
                { userId: userId },
                { $set: { labelList: labelList, docuList: docuList } })
                .catch(err => { console.error(err); return -1; });

            if (finalResult === -1 || finalResult === null)
                return new Result(false, '스크랩을 저장하는 중에 문제가 발생했어요.');

            return new Result(true, '스크랩 저장에 성공했어요.', 0, true);
        }
    }

  // 스크랩 가져오기
  public async getScrap(userId: string) {
    const result: any = await this.model.findOne(
      { userId: userId },
      { _id: false, labelList: true, docuList: true }
    )
      .catch(err => { console.error(err); return -1; });

    if (result === -1)
      return new Result(false, '스크랩 검색에 실패했어요..');

    if (result === null)
      return new Result(false, '해당 스크랩 리스트가 없어요..');

    return new Result(true, '스크랩 가져오기 성공.', 0, result);
  }

  // 라벨을 삭제해요. 라벨을 달고 있는 스크랩도 삭제돼요.
  public async removeLabel(userId: string, label: string) {
    let contain: any = await this.model.findOneAndUpdate(
      { userId: userId }, 
      { $pull: { labelList: label, docuList: { label: label } } },
      { new: true })
      .catch(err => { console.error(err); return null; });

    if (contain === null)
      return new Result(false, '라벨을 삭제하는 도중에 문제가 발생했어요.');

    return new Result(true, '라벨과 라벨과 과련된 스크랩을 모두 삭제완료 했어요.', 0, contain);

    // TODO 충분한 테스트 후에 아래 주석은 삭제 해주세요.
    // contain = await this.model.findOne({ userId: userId })
    //   .catch(err => { console.error(err); return null; });

    // if (contain === null)
    //   return new Result(false, '라벨과 관련된 스크랩들을 검색하는 도중에 에러가 발생했어요.');

    // // docuList가 비어있다면, 어차피 삭제할 필요가 없으니까 성공한거로 인정.
    // if (contain.docuList === undefined || contain.docuList.length < 1) 
    //   return new Result(true, '라벨을 삭제완료 했어요.', 0, contain);

    // const docuList = contain.docuList.filter((filt: any) => {
    //   return filt.label === label ? false : true;
    // });

    // const result: any = await this.model.findOneAndUpdate(
    //   { userId: userId },
    //   { $set: { docuList: docuList }},
    //   { new: true })
    //   .catch(err => { console.error(err); return null; });

    // if (result === null)
    //   return new Result(false, '라벨에 해당하는 스크랩을 삭제하는 도중에 문제가 발생했어요.');

    // return new Result(true, '라벨과 라벨과 과련된 스크랩을 모두 삭제완료 했어요.', 0, result);
  }

  // 스크랩을 삭제해요.
  public async removeArticle(userId: string, label: string, docuId: string) {
    // TODO 아래 주석처리한 코드 충분한 테스트 이후 잘 동작하면 지워주세요.
    // const contain: any = await this.model.findOne({ userId: userId })
    //   .catch(err => { console.error(err); return -1; });

    // if (contain === -1)
    //   return new Result(false, '해당 스크랩이 없거나, 검색 중 문제가 발생했어요.');

    // if (contain === null)
    //   return new Result(false, '아무런 문서도 없었어요.');

    // if (contain.docuList === undefined || contain.docuList.length < 1)
    //   return new Result(false, '항목이 비어 있어요.');

    // const docuList = contain.docuList.filter((filt: any) => {
    //   return filt.label === label && filt.docuId === docuId ? false : true;
    // });

    // const result: any = await this.model.findOneAndUpdate(
    //   { userId: userId },
    //   { $set: { docuList: docuList }},
    //   { new: true })
    //   .catch(err => { console.error(err); return null; });
      
    const result: any = await this.model.findOneAndUpdate(
      { userId: userId},
      { $pull: { docuList: { label: label, docuId: docuId } }},
      { new: true })
      .catch(err => { console.error(err); return null; });
      
    if (result === null)
      return new Result(false, '스크랩을 삭제하는 과정에 문제가 발생했어요.');

    return new Result(true, '스크랩 삭제 완료.', 0, result);
  }

}