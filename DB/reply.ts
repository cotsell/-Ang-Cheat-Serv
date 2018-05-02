import * as mongoose from 'mongoose';
import { Document, Model, Schema } from 'mongoose';
import { Reply as IReply, Result } from '../interface';
import * as uuid from 'uuid/v1';
import { Util } from '../DB/Mongo';

export default class Reply {
	private schema: Schema;
	private model: Model<Document>;

	constructor() {
		this.schema = this.setSchema();
		this.model = mongoose.model<Document>('reply', this.schema);
	}

	setSchema() {
		const schema = new Schema({
			historyId: { type: String, default: uuid },
			parentId: { type: String, required: true },
			text: { type: String },
			userId: { type: String, required: true },
			deleted: { type: Boolean, default: false },
			updated: { type: Boolean, default: false },
			deletedReply: { type: Boolean, default: false },
			rereply: { type: 
				[
					{
						historyId: { type: String, default: uuid },
						parentId: { type: String, required: true },
						text: { type: String },
						userId: { type: String, required: true },
						deleted: { type: Boolean, default: false },
						updated: { type: Boolean, default: false },
						deletedReply: { type: Boolean, default: false },
						createdTime: { type: Date, default: Date.now },
						updatedTime: { type: Date, default: Date.now },
					}
				] },
			createdTime: { type: Date, default: Date.now },
			updatedTime: { type: Date, default: Date.now },
		});
		return schema;
	}

	public getSchema(): Schema {
		return this.schema;
	}

	public getModel(): Model<Document> {
		return this.model;
	}

	// 모든 리플 가져오기.
	public async getAllReply(documentId: string) {
		const result = await this.model.find(
			{ parentId: documentId, deleted: false },
			null,
			{ sort: { createdTime: 1 } })
			.catch(err => {
			console.error(err);
			return null;
		});

		if (result === null)
			return new Result(false, '리플 가져오기에 실패했어요.', 4);

		if (typeof result === 'object') {
			if ([...result].length === 0)
				return new Result(false, '리플이 없어요.', 3);
		}

		const updatedResult = [...result].map(value => {
			if (value.rereply === undefined || value.rereply === null) 
				return value;

			value.rereply = value.rereply.filter((filtering: IReply) => {
				return filtering.deleted === true ? false : true;
			});
			return value;
		});

		console.log([...result]);
		console.log('모든 리플 가져오기 가공 결과물');
		console.log(updatedResult);

		return new Result(true, '리플 가져오기 성공.', 0, updatedResult);
	}

	// 새로운 리플 만들기. 
	// reply에는 parentId, text, userId는 필수로 넣어주세요.
	public async makeReply(reply: IReply) {

		const doc = new this.model({
			parentId: reply.parentId,
			text: reply.text,
			userId: reply.userId,
		});

		const result = await doc.save()
			.catch(err => { console.error(err); return null });
		
		if (result === null) 
			return new Result(false, '댓글 저장에 실패했어요.');

		return new Result(true, '댓글 저장에 성공했어요.', 0, result);
	}

	// 새로운 리리플 만들기.
	public async insertRereply(reply: IReply) {
		const result = await this.model.findOne({ _id: reply.parentId, deleted: false })
			.catch(err => { console.error(err); return null; });
		
		if (result === null)
			return new Result(false, '해당 문서가 없거나, 문서 검색에 실패했어요..');

		const rereplyList: any[] = Util.parse(result)['rereply'];
		rereplyList.push(reply);

		const updateResult = await this.model.findOneAndUpdate(
			{ _id: reply.parentId, deleted: false },
			{ $set: { rereply: rereplyList } },
			{ new: true })
			.catch(err => { console.error(err); return null; });

		console.log(updateResult);

		if (updateResult === null)
			return new Result(false, '문서 업데이트(리리플 작성)에 문제가 생겼어요..');

		const doc: any = Util.parse(updateResult);
		if (doc.nModified === 0)
			return new Result(false, '문서 업데이트(리리플 작성)에 문제가 생겼어요..');

		// deleted된 리리플 솎아내기
		doc.rereply = doc.rereply.filter((filt: IReply) => {
			return filt.deleted === true ? false : true;
		});

		return new Result(true, '리리플 생성 완료.', 0, doc);
	}

	// 리플 삭제하기.
	public async removeReply(userId: string, replyId: string) {
		const result1 = await this.model.findOneAndUpdate(
			{ _id: replyId, userId: userId, deleted: false },
			{ $set: { deleted: true, updatedTime: Date.now() }},
			{ new: true })
			.catch(err => { console.error(err); return null; });

		if (result1 === null)
			return new Result(false, '문서 수정중에 문제가 발생했어요.');

		const replyBefore: IReply = Util.parse(result1);

		const doc: Document  = new this.model({
			historyId: replyBefore.historyId,
			parentId: replyBefore.parentId,
			text: '삭제된 댓글이에요.',
			userId: replyBefore.userId,
			deleted: false,
			updated: replyBefore.updated,
			deletedReply: true,
			rereply: replyBefore.rereply,
			createdTime: replyBefore.createdTime
		});

		const docResult = await doc.save()
			.catch(err => { console.error(err); return null; });

		if (docResult === null)
			return new Result(false, '문서 삭제처리 중 save()에서 문제 발생.');

		return new Result(true, '삭제 완료.', 0, docResult);		
	}

	// 리리플 삭제하기.
	public async removeRereply(userId: string, rereply: IReply) {
		const result1 = await this.model.findOne(
			{ _id: rereply.parentId, 
				deleted: false, 
				rereply: {$elemMatch:{_id: rereply._id}} })
			.catch(err => { console.error(err); return null; });

		if (result1 === null)
			return new Result(false, '해당 리리플이 없거나, 검색에 실패 했어요..');

		const replyResult = Util.parse(result1);
		let rereplyList: IReply[] = [...replyResult.rereply];

		// console.log(`따끈하게 막 뽑아온 rereplyList는..`);
		// console.log(rereplyList);

		let beforeRereply: IReply = { historyId: '', parentId: '', text: '', userId: ''};

		rereplyList = rereplyList.map(value => {
			if (value._id === rereply._id) {
				beforeRereply = Object.assign({}, value);
				value = Object.assign({}, 
					{ 
						...rereply, 
						deleted: false,
						text: '삭제된 댓글이에요.',
						deletedReply: true
					});
				delete value.updatedTime;
				delete value._id;
			}
			return value;
		});
		beforeRereply = Object.assign({}, beforeRereply, 
			{  
				deleted: true,
			});
		delete beforeRereply.updatedTime;
		rereplyList.push(beforeRereply);

		// console.log(`수정완료된 rereplyList는..`);
		// console.log(rereplyList);
		
		const updateResult: any = await this.model.findOneAndUpdate(
			{ _id: rereply.parentId, 
				deleted: false, 
				rereply: { $elemMatch: { _id: rereply._id } } }, 
			{ $set: { rereply: rereplyList } },
			{ new: true }
			)
			.catch(err => { console.error(err); return null; });

		if (updateResult === null)
			return new Result(false, '리리플 정보를 수정 후 리플과 합쳐지는 과정에 문제가 생겼어요.');

		// deleted된 리리플 솎아내기.
		updateResult.rereply = updateResult.rereply.filter((filt: IReply) => {
			return filt.deleted === true ? false : true;
		});

		console.log(`최종 처리된 결과는..`);
		console.log(updateResult);
		return new Result(true, '리플 삭제 완료.', 0, updateResult);
	}

	// 리플 수정
	public async updateReply(userId: string, reply: IReply) {
		const result = await this.model.findOneAndUpdate(
			{ _id: reply._id, deleted: false, userId: reply.userId },
			{ $set: { deleted: true, updatedTime: Date.now() }},
			{ new: true })
			.catch(err => { console.log(err); return null; });

		if (result === null)
			return new Result(false, '해당 리플이 존재하지 않거나, 검색 중 문제가 발생했어요.');

		console.log(`문서 수정 후의 결과물..`);
		console.log(result);
		const parsedReply: IReply = Util.parse(result);

		const doc  = new this.model(
			{
				historyId: parsedReply.historyId,
				parentId: parsedReply.parentId,
				text: reply.text,
				userId: parsedReply.userId,
				createdTime: parsedReply.createdTime,
				deleted: false,
				updated: true,
				deletedReply: false,
				rereply: parsedReply.rereply
			}
		);

		const saveResult = await doc.save()
			.catch(err => { console.error(err); return null; });

		if (saveResult === null)
			return new Result(false, '리플을 수정 후 저장하는 과정에 문제가 발생했어요.');

		return new Result(true, '리플 수정 완료.', 0, saveResult);
	}

	// 리리플 수정.
	public async updateRereply(userId: string, rereply: IReply) {
		const result = await this.model.findOne(
			{ _id: rereply.parentId, deleted: false, userId: userId })
			.catch(err => { console.error(err); return null; });

		if (result === null)
			return new Result(false, '해당 리플이 존재하지 않거나, 검색 중 문제가 발생했어요.');

		const parsedDoc = Util.parse(result);
		if (parsedDoc.rereply.length < 1)
			return new Result(false, '해당 리리플이 존재하지 않아요.. 오디갔지~?');

		let rereplyList: IReply[] = parsedDoc['rereply'];
		let temp: IReply = { historyId: '', parentId: '', text: '', userId: ''};
		rereplyList = rereplyList.map(value => {
			if (value._id === rereply._id) {
				temp = Object.assign({}, value);
				value = Object.assign({}, 
					{
						...rereply,
						updated: true,
					});
			}
			delete value._id;
			delete value.updatedTime;
			return value;
		});

		temp = Object.assign({}, {...temp, deleted: true} );
		delete temp.updatedTime;
		
		rereplyList.push(temp);

		const updatedResult: any = await this.model.findOneAndUpdate(
			{ _id: rereply.parentId, deleted: false, userId: userId },
			{ $set: { rereply: rereplyList } },
			{ new: true })
			.catch(err => { console.error(err); return null; });

		if (updatedResult === null)
			return new Result(false, '리리플을 리플과 합치는 과정에 문제가 발생했어요.');

		// deleted된 리리플 솎아 내기
		updatedResult.rereply = updatedResult.rereply.filter((filt: IReply) => {
			return filt.deleted === true ? false : true;
		});

		return new Result(true, '리리플 수정 완료.', 0, updatedResult);
	}
}